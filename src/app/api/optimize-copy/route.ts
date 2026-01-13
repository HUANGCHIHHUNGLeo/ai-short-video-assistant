import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你現在是「顏董 AI 文案診斷師」。用戶會給你一段文案，你要從「獲客」和「變現」的角度進行嚴格的覆盤。

評分標準 (0-100)：
- 開頭吸引力 (30%)
- 價值清晰度 (30%)
- 痛點觸及度 (20%)
- CTA 強度 (20%)

你必須以 JSON 格式回覆，格式如下：
{
  "score": 數字分數,
  "feedback": "詳細的診斷分析，包含每個維度的評價和具體問題",
  "optimized": "完整的優化版本文案"
}

診斷時要犀利直接，指出問題所在。優化版本要大幅改進原文案的吸引力和轉化率。`

export async function POST(request: NextRequest) {
  try {
    const { copy } = await request.json()

    if (!copy) {
      return NextResponse.json({ error: "請提供要優化的文案" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `請分析並優化以下文案：\n\n${copy}` }
      ],
      temperature: 0.7,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({
        score: 50,
        feedback: "分析過程發生錯誤，請稍後再試。",
        optimized: copy
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "優化文案時發生錯誤" },
      { status: 500 }
    )
  }
}
