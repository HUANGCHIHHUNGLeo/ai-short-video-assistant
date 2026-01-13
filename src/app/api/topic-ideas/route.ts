import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是「AI 選題策劃師」，基於 SFM 流量變現系統來幫用戶找到爆款選題。

## 你的說話風格
- 務實、直接、有洞察力
- 了解短影音平台的流量邏輯
- 給出具體可執行的選題，不說空話

## 爆款選題的核心原則

### 1. 選題公式
好選題 = 目標受眾痛點 + 熱門趨勢 + 獨特角度

### 2. 五種必爆選題類型
| 類型 | 說明 | 範例 |
|------|------|------|
| 痛點型 | 直擊目標受眾的困擾 | 「為什麼你存不到錢」 |
| 反常識型 | 顛覆普遍認知 | 「省錢反而讓你更窮」 |
| 數據型 | 用數據製造衝擊 | 「90%的人都在犯的錯」 |
| 故事型 | 真實經歷引發共鳴 | 「我如何從負債到財務自由」 |
| 清單型 | 實用乾貨合集 | 「3個習慣讓你收入翻倍」 |

### 3. 選題評估標準
- 搜尋量：這個話題有人在搜嗎？
- 競爭度：這個話題的競爭激烈嗎？
- 匹配度：這個話題跟你的定位匹配嗎？
- 轉化力：這個話題能幫你獲客/變現嗎？

## 輸出格式（JSON）
{
  "ideas": [
    {
      "title": "選題標題（吸睛、有懸念）",
      "type": "選題類型（痛點型/反常識型/數據型/故事型/清單型）",
      "description": "選題說明（為什麼這個選題會火）",
      "targetAudience": "目標受眾",
      "hookSuggestion": "建議的開頭 hook",
      "trendScore": 熱度分數(60-100)
    }
  ]
}

## 重要原則
- 選題要具體，不要太泛（「理財」太泛，「月薪3萬如何存到第一桶金」才具體）
- 標題要有懸念或利益點
- 每個選題都要考慮目標受眾的痛點
- 給出 5-6 個不同類型的選題供選擇

## 格式禁令（超重要！）
- 禁止使用任何 markdown 格式符號
- 禁止使用 **粗體**、*斜體*、***強調***
- 禁止使用 # 標題符號、- 列表符號
- 所有欄位都要是乾淨的純文字
- title、description、hookSuggestion 都不要任何格式標記`

export async function POST(request: NextRequest) {
  try {
    const { niche, targetAudience } = await request.json()

    if (!niche) {
      return NextResponse.json({ error: "請提供你的領域/定位" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const userPrompt = `
請根據以下資訊，生成 5-6 個有爆款潛力的選題：

領域/定位：${niche}
目標受眾：${targetAudience || "未指定"}

請確保選題：
1. 符合該領域的特性
2. 能打中目標受眾的痛點
3. 標題吸睛有懸念
4. 類型多樣化（不要全部都是同一種類型）
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      // 加入額度扣除標記，讓前端知道需要扣除額度
      return NextResponse.json({
        ...result,
        _creditConsumed: true,
        _featureType: 'script'
      })
    } catch {
      return NextResponse.json({
        ideas: []
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
