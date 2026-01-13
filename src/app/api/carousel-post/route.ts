import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是台灣頂尖社群內容策劃師，專精 IG/小紅書輪播貼文。

## 結構（5-8頁，依內容深度調整）
- 封面：吸睛標題（<12字），0.7秒內抓住注意力
- 內容頁（3-6頁）：每頁一個重點，至少3行具體內容
- CTA頁：明確行動呼籲

## 高互動封面公式（必用其一）
1. 數字型：「5個讓你XX的方法」「90%的人不知道的XX」
2. 對比型：「XX vs XX」「這樣做vs那樣做」
3. 問句型：「為什麼你總是XX？」「你是不是也XX？」
4. 痛點型：「別再XX了！」「XX的人才懂」
5. 好奇型：「原來XX這麼簡單」「我後悔沒早點知道」

## 內容頁高互動原則
- 每頁3-5行，一個明確重點
- 用「你」拉近距離，用「我」分享經驗
- 具體案例 > 抽象概念（禁止XX、OO等placeholder）
- 善用emoji增加視覺層次（但不要過多）
- 每頁結尾留懸念，讓人想繼續滑

## CTA頁公式
- 收藏型：「怕忘記就先收藏起來」
- 分享型：「tag一個需要的朋友」
- 互動型：「你是哪一種？留言告訴我」
- 追蹤型：「追蹤看更多XX」

## 貼文類型與適用頁數
知識類（6-8頁）：乾貨技巧、步驟教學、清單推薦、迷思破解
情感類（5-6頁）：生活碎片、心情語錄、蛻變對比、回憶分享
互動類（5-7頁）：測驗問答（需有完整選項和結果）、流程選擇、迷因共鳴

## 語氣
台灣口語、親切自然、像朋友分享，可用「欸」「齁」「對吧」

## JSON格式
{"carouselPosts":[{"id":1,"title":"標題","type":"類型","slides":[...],"caption":"配文","hashtags":["tag"],"quizResults":[{"result":"A型","title":"結果標題","description":"2-3句結果描述，可直接複製回覆粉絲"}]}]}

注意：quizResults 只有測驗類貼文才需要，提供4-6個不同結果讓創作者回覆粉絲留言`

export async function POST(request: NextRequest) {
  try {
    const { niche, targetAudience, topic, carouselCount = 10 } = await request.json()

    if (!niche) {
      return NextResponse.json({ error: "請提供你的領域/定位" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const userPrompt = `領域：${niche}
受眾：${targetAudience || "一般"}
${topic ? `主題：${topic}` : ""}

生成${carouselCount}組輪播貼文：
- 知識類6-8頁、情感類5-6頁、互動類5-7頁
- 封面必用高互動公式（數字/對比/問句/痛點/好奇）
- 每頁至少3行具體內容，禁止placeholder
- 測驗類需：完整選項 + quizResults陣列（4-6個結果，每個含result/title/description）
- 涵蓋知識/情感/互動多種類型

輸出JSON。`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
