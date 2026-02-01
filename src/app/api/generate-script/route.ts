import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

// 提高超時上限（streaming 可以跑更久）
export const maxDuration = 120

export async function POST(request: NextRequest) {
  try {
    // 檢查認證和額度
    const authResult = await checkApiAuth(request, 'script')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const { creatorBackground, videoSettings, generateVersions = 3, positioningData, preAnalysisAnswers, preAnalysisQuestions } = await request.json()

    if (!creatorBackground?.niche || !videoSettings?.topic) {
      return NextResponse.json({ error: "請提供完整的創作者背景和影片設定" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 使用模組化 prompt - 動態組合 user prompt
    const userPrompt = buildUserPrompt({
      creatorBackground,
      videoSettings,
      generateVersions,
      positioningData,
      preAnalysisAnswers,
      preAnalysisQuestions
    })

    // 使用模組化 prompt - 根據拍攝類型動態組合
    const systemPrompt = buildSystemPrompt({
      shootingType: videoSettings.shootingType || 'talking_head',
      includeFrameworks: true,
    })

    // 根據訂閱等級設定 token 上限
    const isPremium = authResult.tier === 'pro' || authResult.tier === 'lifetime'
    const maxTokens = isPremium ? 16000 : 12000

    // 使用 streaming 避免超時
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: maxTokens,
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
            // 最後一個 chunk 會包含 usage
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
                id: "A",
                style: "標準版",
                styleDescription: "AI 生成的腳本",
                framework: "HOOK-CONTENT-CTA",
                script: {
                  title: videoSettings.topic,
                  segments: [],
                  bgm: { style: "輕快", mood: "活潑", suggestions: [] },
                  cta: "追蹤看更多～"
                },
                shootingTips: ["光線要夠", "收音要清楚", "多拍幾次"],
                equipmentNeeded: ["手機", "腳架"],
                rawContent: fullContent
              }],
              error: "解析腳本時發生問題，已返回基本格式"
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

          // Pro/Lifetime 用戶保存生成記錄
          let generationId: string | null = null
          if (isPremium && (result.versions as Array<unknown>)?.length > 0) {
            generationId = await saveGeneration({
              userId: authResult.userId,
              featureType: 'script',
              title: `腳本 - ${videoSettings.topic}（${(result.versions as Array<unknown>).length}版本）`,
              inputData: { creatorBackground, videoSettings, generateVersions },
              outputData: result,
              modelUsed: 'gpt-4o',
              tokensUsed: promptTokens + completionTokens
            })
          }

          // 發送最終結果（包含完整解析後的資料和 metadata）
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'done',
            result,
            generationId,
            _creditConsumed: true,
            _featureType: 'script',
            _remainingCredits: authResult.remainingCredits,
            _isGuest: authResult.isGuest
          })}\n\n`))

          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'error',
            error: '生成腳本時發生錯誤，請稍後再試'
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
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成腳本時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
