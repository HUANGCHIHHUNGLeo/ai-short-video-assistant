import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是台灣頂尖社群內容策劃師，專精 IG/小紅書輪播貼文。

## 結構（5-6頁）
1. 封面：吸睛標題（<12字），0.7秒抓住注意力
2. 內容頁（3-4頁）：每頁一個重點，至少3行具體內容
3. CTA頁：明確行動呼籲（收藏/追蹤/留言）

## 高互動原則
- 封面用數字、對比、問句製造好奇
- 內容具體實用，不要空泛（禁止XX、OO等placeholder）
- 每頁3-5行，有乾貨有共鳴
- CTA用行動詞：「立刻收藏」「分享給需要的人」

## 貼文類型
知識類：乾貨技巧、步驟教學、清單推薦、迷思破解
情感類：生活碎片、心情語錄、蛻變對比、回憶分享
互動類：測驗問答、流程選擇、迷因共鳴

## 語氣
台灣口語、親切自然、像朋友分享

## JSON格式
{"carouselPosts":[{"id":1,"title":"標題","type":"類型","slides":[{"page":1,"type":"cover","headline":"封面標題","subheadline":"副標"},{"page":2,"type":"content","headline":"標題","body":"至少3行具體內容"},{"page":6,"type":"cta","headline":"CTA標題","body":"行動呼籲"}],"caption":"配文","hashtags":["tag"]}]}`

export async function POST(request: NextRequest) {
  try {
    const { niche, targetAudience, topic, carouselCount = 20 } = await request.json()

    if (!niche) {
      return NextResponse.json({ error: "請提供你的領域/定位" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const userPrompt = `領域：${niche}
受眾：${targetAudience || "一般"}
${topic ? `主題：${topic}` : ""}

生成${carouselCount}組輪播貼文，要求：
- 每組5-6頁（封面+3-4內容+CTA）
- 每頁內容至少3行，具體有料
- 涵蓋知識/情感/互動類型
- 內容必須完整具體，禁止用XX、OO等placeholder
- 測驗類要有真實選項和結果描述

輸出JSON。`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.9,
      max_tokens: 10000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({
        carouselPosts: [],
        error: "解析結果時發生錯誤"
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成輪播貼文時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
