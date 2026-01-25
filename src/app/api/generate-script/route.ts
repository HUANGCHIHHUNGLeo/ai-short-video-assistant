import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

// Vercel 超時設定（Hobby 方案最多 60 秒，Pro 方案可到 300 秒）
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    // 檢查認證和額度
    const authResult = await checkApiAuth(request, 'script')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const { creatorBackground, videoSettings, generateVersions = 3, positioningData } = await request.json()

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
      positioningData
    })

    // 使用模組化 prompt - 根據拍攝類型動態組合
    const systemPrompt = buildSystemPrompt({
      shootingType: videoSettings.shootingType || 'talking_head',
      includeFrameworks: true,
    })

    // 根據訂閱等級設定 token 上限：付費版可生成更完整的內容
    const isPremium = authResult.tier === 'pro' || authResult.tier === 'lifetime'
    const maxTokens = isPremium ? 16000 : 12000

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: maxTokens,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)

      // 記錄使用量
      await recordUsage(request, authResult.userId, 'script')

      // 追蹤 API 成本
      if (completion.usage) {
        await trackApiCost({
          userId: authResult.userId || undefined,
          featureType: 'script',
          modelName: 'gpt-4o',
          inputTokens: completion.usage.prompt_tokens,
          outputTokens: completion.usage.completion_tokens,
        })
      }

      // Pro/Lifetime 用戶保存生成記錄到 generations 表
      const isPremium = authResult.tier === 'pro' || authResult.tier === 'lifetime'
      let generationId: string | null = null
      if (isPremium && result.versions?.length > 0) {
        generationId = await saveGeneration({
          userId: authResult.userId,
          featureType: 'script',
          title: `腳本 - ${videoSettings.topic}（${result.versions.length}版本）`,
          inputData: { creatorBackground, videoSettings, generateVersions },
          outputData: result,
          modelUsed: 'gpt-4o',
          tokensUsed: completion.usage?.total_tokens
        })
      }

      return NextResponse.json({
        ...result,
        generationId,
        _creditConsumed: true,
        _featureType: 'script',
        _remainingCredits: authResult.remainingCredits,
        _isGuest: authResult.isGuest
      })
    } catch {
      return NextResponse.json({
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
          estimatedMetrics: {
            completionRate: "50-60%",
            engagementRate: "5-8%",
            bestPostTime: "晚上 8-10 點"
          },
          rawContent: content
        }],
        error: "解析腳本時發生問題，已返回基本格式"
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成腳本時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
