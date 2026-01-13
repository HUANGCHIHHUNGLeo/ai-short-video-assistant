import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const systemPrompt = `你現在是「顏董 AI 腳本大師」。你的任務是根據用戶的主題，生成一支 30-60 秒的爆款短影音腳本。

必須嚴格遵守以下結構：
1. 【標題】：吸睛、有懸念。
2. 【開頭 (0-3秒)】：使用「五種爆款開頭」之一，必須極具衝擊力。
   - 提問直擊痛點：「你是不是也覺得存不到錢？」
   - 反常識觀點：「省錢是窮人的思維，有錢人都在花錢！」
   - 數據震驚：「90% 的人都不知道這個隱藏功能...」
   - 故事懸念：「我 19 歲買房的那一年，發生了一件事...」
   - 直接利益：「這支影片教你如何月入 10 萬...」
3. 【主體 (3-45秒)】：提供乾貨或情緒價值，節奏要快，金句要多。
4. 【結尾 (45-60秒)】：強力的 CTA，引導留言或私訊。

語氣要自信、專業，帶點顏董的個人風格。偶爾使用「哎呀」這個口頭禪。
輸出格式要包含時間標記、畫面描述、口播內容。`

export async function POST(request: NextRequest) {
  try {
    const { topic, audience, duration, keyMessage, openingStyle } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: "請提供影片主題" }, { status: 400 })
    }

    const userPrompt = `
請為以下主題生成爆款短影音腳本：

主題：${topic}
目標受眾：${audience || "一般大眾"}
影片時長：${duration || "30-60"} 秒
核心觀點：${keyMessage || "無特定"}
開頭風格：${openingStyle || "自動選擇最適合的"}

請生成完整的分鏡腳本，包含時間標記、畫面描述和口播內容。
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
    })

    const script = completion.choices[0]?.message?.content || "生成失敗，請稍後再試。"

    return NextResponse.json({ script })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成腳本時發生錯誤" },
      { status: 500 }
    )
  }
}
