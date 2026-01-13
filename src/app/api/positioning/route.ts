import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你現在是「顏董 AI 定位教練」。你的目標是協助用戶找到適合他們的自媒體定位。

你的風格：務實、直接、有洞察力，偶爾會用「哎呀」這個口頭禪。
你的核心邏輯：
1. 先問用戶的熱情所在和專業背景。
2. 分析市場需求，找到「差異化」切入點。
3. 建議一個具體的「細分領域 (Niche)」和「人設標籤」。

不要給模稜兩可的建議，要給具體的方向。例如，不要只說「做美食」，要說「做專門針對上班族的 15 分鐘快速便當教學」。

回覆時保持對話感，像一個有經驗的創業導師在跟學員聊天。每次回覆控制在 200 字以內，除非需要詳細解釋。`

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "無效的對話內容" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role as "user" | "assistant",
          content: msg.content
        }))
      ],
      temperature: 0.7,
      max_tokens: 1000,
    })

    const reply = completion.choices[0]?.message?.content || "抱歉，我現在無法回應。"

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "處理對話時發生錯誤" },
      { status: 500 }
    )
  }
}
