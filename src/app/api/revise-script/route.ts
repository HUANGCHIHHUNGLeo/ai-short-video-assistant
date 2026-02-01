import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { checkApiAuth, recordUsage, authError } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"
import { CORE_PRINCIPLES } from "@/lib/prompts/core"
import { TAIWAN_STYLE, FORBIDDEN_WORDS } from "@/lib/prompts/taiwan-style"
import { OUTPUT_FORMAT } from "@/lib/prompts/output-format"

export const maxDuration = 120

const SHOOTING_TYPE_NAMES: Record<string, string> = {
  talking_head: "口播型",
  behind_camera: "藏鏡人（一人掌鏡提問，一人出鏡回答）",
  voiceover: "純配音",
  acting: "演戲/情境劇",
  vlog: "Vlog",
  tutorial: "教學示範",
  interview: "訪談對談",
  storytime: "說故事",
}

export async function POST(request: NextRequest) {
  try {
    // 認證檢查 + 扣額度
    const authResult = await checkApiAuth(request, 'script')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const {
      originalVersion,
      revisionFeedback,
      creatorBackground,
      videoSettings,
      positioningData,
    } = await request.json()

    if (!originalVersion || !revisionFeedback) {
      return NextResponse.json(
        { error: "缺少原始腳本或修改指令" },
        { status: 400 }
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const shootingTypeName = SHOOTING_TYPE_NAMES[videoSettings?.shootingType] || "口播型"

    // 精簡版 system prompt（修改不需要完整的框架指引）
    const systemPrompt = [
      CORE_PRINCIPLES,
      TAIWAN_STYLE,
      FORBIDDEN_WORDS,
      OUTPUT_FORMAT,
    ].join('\n\n')

    // 組合定位摘要
    let positioningContext = ''
    if (positioningData) {
      const parts: string[] = []
      if (positioningData.positioningStatement) parts.push(`定位宣言：${positioningData.positioningStatement}`)
      if (positioningData.niche) parts.push(`定位利基：${positioningData.niche}`)
      if (positioningData.persona?.coreIdentity) parts.push(`人設定位：${positioningData.persona.coreIdentity}`)
      if (positioningData.targetAudience?.who) parts.push(`目標受眾：${positioningData.targetAudience.who}`)
      if (parts.length > 0) {
        positioningContext = `\n## 創作者定位（修改時要維持一致）\n${parts.join('\n')}`
      }
    }

    // 將原始腳本轉為文字
    const originalScriptText = JSON.stringify(originalVersion, null, 2)

    const userPrompt = `你是短影音腳本修改專家。使用者已經生成了一個腳本版本，現在想根據自己的反饋進行修改。

## 創作者背景
- 領域：${creatorBackground?.niche || "未填"}
- 目標觀眾：${creatorBackground?.targetAudience || "未填"}
${positioningContext}

## 影片設定
- 主題：${videoSettings?.topic || "未填"}
- 拍攝方式：${shootingTypeName}
- 影片長度：${videoSettings?.duration || 45} 秒

## 原始腳本（要在這個基礎上修改）
${originalScriptText}

## ⚠️⚠️⚠️ 使用者的修改要求（最重要！必須完全遵守！）
${revisionFeedback}

## 修改規則
1. 只修改使用者提到的部分，其他部分保持不變
2. 修改後的腳本格式必須跟原始腳本完全一樣（JSON 結構不變）
3. 保持原始腳本的優點，只改掉使用者不滿意的地方
4. 修改後的 voiceover 字數不能比原來少（要維持相同時長）
5. 修改後的內容要更貼近使用者想要的方向
6. 輸出完整的修改後版本（不是只輸出修改的部分）

## 輸出格式
請直接輸出 JSON，格式跟原始腳本一模一樣，但 id 改為 "${originalVersion.id || 'A'}'"，style 前面加上「修改版 - 」。

{
  "versions": [
    修改後的完整版本（只有一個版本）
  ]
}

請用 JSON 格式輸出。`

    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 8000,
      response_format: { type: "json_object" },
      stream: true,
      stream_options: { include_usage: true }
    })

    let fullContent = ''
    let promptTokens = 0
    let completionTokens = 0
    const encoder = new TextEncoder()

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || ''
            if (content) {
              fullContent += content
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content })}\n\n`))
            }
            if (chunk.usage) {
              promptTokens = chunk.usage.prompt_tokens
              completionTokens = chunk.usage.completion_tokens
            }
          }

          // 解析完整 JSON
          let result: Record<string, unknown>
          try {
            result = JSON.parse(fullContent)
          } catch {
            result = {
              versions: [{
                ...originalVersion,
                id: `${originalVersion.id || 'A'}'`,
                style: `修改版 - ${originalVersion.style || '標準版'}`,
                styleDescription: "修改版（解析失敗，返回原版）",
              }],
              error: "解析修改結果時發生問題"
            }
          }

          // 記錄使用量
          await recordUsage(request, authResult.userId, 'script')

          // 追蹤 API 成本
          if (promptTokens > 0 || completionTokens > 0) {
            await trackApiCost({
              userId: authResult.userId || undefined,
              featureType: 'script',
              modelName: 'gpt-4o',
              inputTokens: promptTokens,
              outputTokens: completionTokens,
            })
          }

          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            result,
            _creditConsumed: true,
            _featureType: 'script',
            _remainingCredits: authResult.remainingCredits,
            _isGuest: authResult.isGuest
          })}\n\n`))

          controller.close()
        } catch (error) {
          console.error("Revise stream error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: '修改腳本時發生錯誤，請稍後再試'
          })}\n\n`))
          controller.close()
        }
      }
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      }
    })
  } catch (error) {
    console.error("Revise API Error:", error)
    return NextResponse.json(
      { error: "修改腳本時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
