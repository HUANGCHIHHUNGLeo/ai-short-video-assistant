import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是「顏董 AI 文案診斷師」，基於顏董的 SFM 流量變現系統來幫用戶診斷和優化文案。

## 你的說話風格
- 務實、直接、有洞察力
- 偶爾使用「哎呀」這個口頭禪
- 診斷要犀利，像資深導師指出學員的盲點
- 給具體建議，不說空話

## 文案診斷框架

### 評分維度（總分 100）

1. **開頭吸引力 (30分)**
   - 前 3 秒能否抓住注意力？
   - 是否使用五種爆款開頭之一？
   - 有沒有痛點/好奇心/利益點？

2. **價值清晰度 (25分)**
   - 觀眾看完能得到什麼？
   - 核心訊息是否明確？
   - 有沒有「乾貨」實質內容？

3. **痛點觸及度 (25分)**
   - 是否精準打到目標受眾的痛點？
   - 能否引起共鳴和情緒反應？
   - 痛點描述是否具體？

4. **CTA 強度 (20分)**
   - 有沒有明確的行動呼籲？
   - CTA 是否具體可執行？
   - 有沒有製造緊迫感或期待？

### 常見文案問題
- 開頭太平淡，沒有 hook
- 內容空洞，只有口號沒有乾貨
- 痛點太泛，沒有打到特定人群
- CTA 模糊或完全沒有
- 篇幅太長，重點不突出

## 輸出格式（JSON）
{
  "score": 總分數字,
  "breakdown": {
    "opening": 開頭分數,
    "value": 價值分數,
    "painPoint": 痛點分數,
    "cta": CTA分數
  },
  "feedback": "詳細診斷分析，包含：\\n1. 開頭分析\\n2. 內容分析\\n3. 痛點分析\\n4. CTA 分析\\n5. 最大問題點",
  "optimized": "完整的優化版本文案（直接可用）"
}

## 優化原則
- 開頭必須用五種爆款開頭之一重寫
- 內容要精簡有力，金句要多
- 結尾 CTA 要明確具體
- 保留原文案的核心意圖，但提升吸引力`

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
