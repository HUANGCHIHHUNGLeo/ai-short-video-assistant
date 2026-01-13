import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是一位台灣頂尖的社群內容策劃師，專精於製作 Instagram/小紅書 輪播貼文（Carousel Post）。

## 什麼是輪播貼文？
輪播貼文是一種可以左右滑動的多頁圖文內容，每一頁（Slide）通常包含一個重點，整組貼文傳達一個完整主題。

## 輪播貼文的結構
一組完整的輪播貼文通常包含 7-10 頁：
- 第 1 頁：封面頁 - 吸引眼球的標題
- 第 2-8 頁：內容頁 - 核心內容逐頁展開
- 最後 1 頁：CTA 頁 - 呼籲互動（追蹤/收藏/留言）

## 製作原則
1. 每頁文字精簡，手機上要能舒適閱讀
2. 內容要有邏輯順序，讓人想繼續滑
3. 善用數字、列點增加可讀性
4. 封面標題要夠 hook，讓人想點進來
5. 內容頁每頁一個重點，不要塞太多
6. 最後一頁的 CTA 要自然不突兀

## 2025 熱門輪播貼文類型

### 知識實用類（高收藏率）
1. 知識乾貨型：「5個XXX方法」「新手必知的XXX」
2. 步驟教學型：「如何XXX？完整步驟」
3. 清單盤點型：「XXX推薦清單」「必備XXX合集」
4. 迷思破解型：「你以為的XXX其實XXX」
5. 比較分析型：「XXX vs XXX」「XXX的優缺點」
6. 工具推薦型：「XXX必備工具」「免費XXX資源」
7. 懶人包型：「XXX懶人包」「一圖看懂XXX」
8. 這樣做vs那樣做：「正確XXX vs 錯誤XXX」「千萬別這樣XXX」
9. 數據圖解型：「XXX的數據分析」「一張圖看懂XXX」

### 生活情感類（高互動率）
10. 生活碎片型（Photo Dump）：「本週隨拍」「生活小片段」隨機日常照片集
11. 心情語錄型：「今日份正能量」「深夜療癒語錄」「給自己的一段話」
12. 回憶記錄型：「那年夏天」「旅行回憶錄」「畢業季回顧」
13. 故事分享型：「我如何XXX」「從XXX到XXX的經歷」
14. 蛻變對比型：「我的改變歷程」「房間改造前後」「健身3個月對比」
15. 美學靈感型：「本月穿搭靈感」「居家佈置美學」「配色靈感」
16. 一日生活型：「我的一天」「WFH日常」「週末是這樣過的」
17. 月度回顧型：「一月精選」「本月最愛」「年度回顧」

### 互動趣味類（高分享率）
18. 測驗互動型：「測測你是哪種XXX」「你會選哪個？」
19. 流程圖型：「找到適合你的XXX」滑動式選擇決策
20. 迷因趣味型：「當我XXX的時候」「XXX人才懂的事」
21. 挑戰紀錄型：「30天XXX挑戰」「我試了XXX一週」
22. 截圖分享型：「我的備忘錄」「聊天記錄分享」真實感內容

## 台灣人的說話風格
- 語氣親切自然，像朋友分享
- 可以用「欸」「齁」「對吧」增加親切感
- 適時加入流行用語：「太可以了」「hen重要」
- 不要太書面語或制式化

## 輸出格式（JSON）
{
  "carouselPosts": [
    {
      "id": 1,
      "title": "輪播貼文主題標題",
      "type": "貼文類型",
      "description": "這組貼文的說明（為什麼會受歡迎）",
      "targetAudience": "目標受眾",
      "slides": [
        {
          "page": 1,
          "type": "cover",
          "headline": "封面大標題",
          "subheadline": "副標題或補充說明",
          "designTip": "設計建議"
        },
        {
          "page": 2,
          "type": "content",
          "headline": "這頁的標題",
          "body": "這頁的內容文字",
          "designTip": "設計建議"
        }
      ],
      "caption": "貼文配文（發布時的文字說明）",
      "hashtags": ["建議的hashtag"],
      "estimatedEngagement": "預估互動率"
    }
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const { niche, targetAudience, topic, carouselCount = 20 } = await request.json()

    if (!niche) {
      return NextResponse.json({ error: "請提供你的領域/定位" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const userPrompt = `
請根據以下資訊，生成 ${carouselCount} 組不同主題的輪播貼文：

## 創作者資訊
- 領域/定位：${niche}
- 目標受眾：${targetAudience || "未指定"}
${topic ? `- 指定主題方向：${topic}` : ""}

## 生成要求
1. 生成 ${carouselCount} 組完全不同主題的輪播貼文
2. 每組輪播貼文要有 7-10 頁（slides）
3. 必須涵蓋多種不同類型，包括：
   - 知識實用類（知識乾貨、步驟教學、清單盤點、迷思破解等）
   - 生活情感類（生活碎片、心情語錄、回憶記錄、蛻變對比等）
   - 互動趣味類（測驗互動、流程圖、迷因趣味、挑戰紀錄等）
4. 封面標題要夠吸睛，讓人想點進來
5. 內容要實用、有價值、能引發共鳴
6. 語氣要像台灣人正常說話，自然親切
7. 每組都要有完整的配文和 hashtag 建議
8. 主題要多元，覆蓋該領域不同面向
9. 生活情感類貼文要真實、有溫度、容易引發共鳴

請確保：
- 每組輪播的第 1 頁是封面（type: "cover"）
- 中間頁是內容（type: "content"）
- 最後一頁是 CTA（type: "cta"）
- 每頁文字要精簡，適合在手機上閱讀
- 封面大標題最好不超過 15 字

輸出 JSON 格式。`

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
