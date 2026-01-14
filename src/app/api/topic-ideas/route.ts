import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { searchTrends, formatSearchResultsForPrompt } from "@/lib/serper"

const systemPrompt = `你是「AI 選題策劃師」，基於 SFM 流量變現系統來幫用戶找到爆款選題。你擁有最新的網路趨勢資訊，能幫用戶找到當下最熱門的選題方向。

## 你的說話風格
- 務實、直接、有洞察力
- 了解短影音平台的流量邏輯
- 給出具體可執行的選題，不說空話

## 爆款選題的核心原則

### 1. 選題公式
好選題 = 目標受眾痛點 + 熱門趨勢 + 獨特角度

### 2. 八種必爆選題類型
| 類型 | 說明 | 範例 | 適用場景 |
|------|------|------|---------|
| 痛點型 | 直擊目標受眾的困擾 | 「為什麼你存不到錢」 | 建立共鳴，吸引精準受眾 |
| 反常識型 | 顛覆普遍認知 | 「省錢反而讓你更窮」 | 製造話題，引發討論 |
| 數據型 | 用數據製造衝擊 | 「90%的人都在犯的錯」 | 建立權威，增加說服力 |
| 故事型 | 真實經歷引發共鳴 | 「我如何從負債到財務自由」 | 情感連結，提高信任 |
| 清單型 | 實用乾貨合集 | 「3個習慣讓你收入翻倍」 | 高收藏率，傳遞價值 |
| 時事蹭熱型 | 結合當下熱門話題 | 「從XX事件看到的理財啟示」 | 蹭流量，快速曝光 |
| 對比型 | 前後/好壞對比 | 「窮人思維 vs 富人思維」 | 視覺衝擊，容易理解 |
| 教學型 | 步驟式教學 | 「手把手教你XXX」 | 高實用性，容易被收藏 |

### 3. 選題評估維度
- 搜尋熱度：這個話題最近有人在搜嗎？
- 競爭激烈度：這個話題的競爭激烈嗎？
- 定位匹配度：這個話題跟創作者的定位匹配嗎？
- 變現潛力：這個話題能幫助獲客/變現嗎？
- 完播友好度：這個話題容易讓人看完嗎？
- 互動潛力：這個話題容易讓人留言嗎？

### 4. 2025-2026 平台趨勢
- IG Reels：知識型 + 有質感的視覺呈現
- TikTok：娛樂性 + 快節奏 + 原創梗
- 小紅書：種草 + 攻略 + 真實體驗分享
- YouTube Shorts：教學 + 精華片段 + 導流長影片

## 輸出格式（JSON）
{
  "ideas": [
    {
      "title": "選題標題（吸睛、有懸念、15-25字）",
      "type": "選題類型",
      "description": "選題說明（為什麼這個選題會火，50-80字）",
      "targetAudience": "目標受眾（具體人群）",
      "hookSuggestion": "建議的開頭 hook（前3秒吸引人的話）",
      "contentOutline": ["內容大綱點1", "內容大綱點2", "內容大綱點3"],
      "platformTips": "平台發布建議",
      "trendScore": 熱度分數(60-100),
      "competitionLevel": "競爭程度（低/中/高）",
      "conversionPotential": "變現潛力說明"
    }
  ],
  "trendInsights": "基於搜尋結果的趨勢洞察（如果有即時搜尋資料的話）"
}

## 重要原則
- 選題要具體，不要太泛（「理財」太泛，「月薪3萬如何存到第一桶金」才具體）
- 標題要有懸念、數字或利益點
- 每個選題都要考慮目標受眾的痛點
- 給出 6-8 個不同類型的選題供選擇
- 如果有即時搜尋結果，要參考當下熱門話題來調整選題

## 格式禁令（超重要！）
- 禁止使用任何 markdown 格式符號
- 禁止使用 **粗體**、*斜體*、***強調***
- 禁止使用 # 標題符號、- 列表符號
- 所有欄位都要是乾淨的純文字
- title、description、hookSuggestion 都不要任何格式標記`

export async function POST(request: NextRequest) {
  try {
    const { niche, targetAudience, useRealTimeSearch = true } = await request.json()

    if (!niche) {
      return NextResponse.json({ error: "請提供你的領域/定位" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 如果啟用即時搜尋，先搜尋相關趨勢
    let searchContext = ''
    let searchPerformed = false

    if (useRealTimeSearch && process.env.SERPER_API_KEY) {
      try {
        console.log(`Searching trends for: ${niche}`)
        const trendResults = await searchTrends(niche)
        searchContext = formatSearchResultsForPrompt(trendResults)
        searchPerformed = trendResults.some(r => r.results.length > 0)
        console.log(`Search completed, found results: ${searchPerformed}`)
      } catch (searchError) {
        console.error('Trend search failed:', searchError)
        // 繼續執行，只是沒有搜尋結果
      }
    }

    const userPrompt = `
請根據以下資訊，生成 6-8 個有爆款潛力的選題：

領域/定位：${niche}
目標受眾：${targetAudience || "未指定"}
${searchContext ? `\n${searchContext}\n\n請特別參考以上即時搜尋結果，找出當下最熱門的話題方向，並融入選題建議中。` : ''}

請確保選題：
1. 符合該領域的特性
2. 能打中目標受眾的痛點
3. 標題吸睛有懸念（使用數字、問句、反常識等技巧）
4. 類型多樣化（不要全部都是同一種類型）
5. 至少要有 1-2 個蹭熱點/時事型的選題（如果有即時搜尋結果的話）
6. 每個選題都要有具體的內容大綱
7. 要說明這個選題適合發在哪個平台
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // 選題用 mini 就夠了，省成本
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.85,
      max_tokens: 3000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json({
        ...result,
        _creditConsumed: true,
        _featureType: 'script',
        _searchPerformed: searchPerformed
      })
    } catch {
      return NextResponse.json({
        ideas: [],
        error: "解析結果失敗"
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成選題時發生錯誤" },
      { status: 500 }
    )
  }
}
