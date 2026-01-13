import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是一位專業的短影音腳本策劃師，擅長根據創作者的定位和目標受眾，量身打造高轉化的腳本。

## 你的任務
根據用戶提供的完整背景資訊，生成一支符合他們定位、風格、目標的短影音腳本。

## 爆款腳本核心公式

### 1. 黃金開頭（0-3秒）- 決定 80% 的流量
根據影片目標和受眾痛點，選擇最適合的開頭類型：

| 目標 | 推薦開頭 | 範例 |
|------|----------|------|
| 曝光獲客 | 反常識/數據震驚 | 「90% 的人都在浪費時間做這件事」 |
| 互動漲粉 | 提問直擊痛點 | 「你是不是也有這個困擾？」 |
| 建立信任 | 故事懸念/專業展示 | 「我花了 3 年時間才搞懂這件事...」 |
| 導流變現 | 直接利益 | 「看完這支影片，你會學到...」 |

### 2. 內容主體
- 「三段式結構」：問題 → 方法 → 結果
- 根據創作者風格調整語氣
- 內容要打到目標受眾的痛點
- 每 5-10 秒一個重點，節奏要快
- 乾貨要實用可執行

### 3. 結尾 CTA
根據用戶選擇的 CTA 類型，設計具體的行動呼籲：
- follow: 引導追蹤
- like: 引導按讚收藏
- comment: 引導留言互動
- share: 引導分享
- dm: 引導私訊
- link: 引導點擊連結

## 輸出格式
請按照以下格式輸出（不要使用 markdown 的 ** 符號）：

【標題】
（根據主題生成吸睛標題）

【開頭 | 0-3秒】
畫面：（簡短畫面描述）
口播：（開頭台詞，要抓住注意力）

【主體 | 第一段】
畫面：（畫面描述）
口播：（內容台詞）

【主體 | 第二段】
畫面：（畫面描述）
口播：（內容台詞）

【主體 | 第三段】
畫面：（畫面描述）
口播：（內容台詞）

【結尾 CTA】
畫面：（畫面描述）
口播：（行動呼籲）

---
拍攝建議：
1. （第一點建議）
2. （第二點建議）
3. （第三點建議）

## 重要原則
- 腳本要完全符合用戶的定位和目標受眾
- 語氣風格要符合用戶選擇的說話風格
- 開頭必須在 3 秒內抓住注意力
- 內容要有「料」，不能只有空洞的口號
- CTA 要具體明確
- 時長要符合用戶選擇的範圍`

export async function POST(request: NextRequest) {
  try {
    const { creatorBackground, videoSettings } = await request.json()

    // 支援舊格式（向後兼容）
    if (!creatorBackground && !videoSettings) {
      const { topic, audience, duration, keyMessage, openingStyle } = await request.json()
      if (!topic) {
        return NextResponse.json({ error: "請提供影片主題" }, { status: 400 })
      }
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 構建詳細的用戶 prompt
    const styleMap: Record<string, string> = {
      professional: "專業權威型，像老師一樣教學，用詞精準專業",
      friendly: "親切朋友型，像朋友分享經驗，輕鬆自然",
      energetic: "熱血激勵型，充滿能量和感染力，語調激昂",
      humorous: "幽默風趣型，輕鬆有趣好消化，適時加入玩笑",
      storytelling: "故事敘事型，用故事帶出觀點，情節引人入勝"
    }

    const goalMap: Record<string, string> = {
      awareness: "曝光獲客 - 讓更多人認識創作者",
      engagement: "互動漲粉 - 增加留言分享",
      trust: "建立信任 - 展現專業度",
      conversion: "導流變現 - 引導私訊或購買"
    }

    const ctaMap: Record<string, string> = {
      follow: "引導追蹤帳號",
      like: "引導按讚收藏",
      comment: "引導留言互動",
      share: "引導分享給朋友",
      dm: "引導私訊諮詢",
      link: "引導點擊連結"
    }

    const userPrompt = `
請根據以下完整資訊，生成一支量身打造的短影音腳本：

## 創作者背景
- 領域/定位：${creatorBackground?.niche || "未指定"}
- 專業背景：${creatorBackground?.expertise || "未指定"}
- 目標受眾：${creatorBackground?.targetAudience || "未指定"}
- 受眾痛點：${creatorBackground?.audiencePainPoints || "未指定"}
- 說話風格：${styleMap[creatorBackground?.contentStyle] || "自然專業"}

## 影片設定
- 主題：${videoSettings?.topic || "未指定"}
- 目標：${goalMap[videoSettings?.goal] || "未指定"}
- 時長：${videoSettings?.duration || "30-60"} 秒
- 核心訊息：${videoSettings?.keyMessage || "未指定"}
- CTA 類型：${ctaMap[videoSettings?.cta] || "引導追蹤"}

請生成完整的分鏡腳本，確保：
1. 開頭要針對「${creatorBackground?.targetAudience}」的痛點
2. 內容要符合「${styleMap[creatorBackground?.contentStyle] || "自然專業"}」的風格
3. 結尾 CTA 要具體執行「${ctaMap[videoSettings?.cta] || "引導追蹤"}」
`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
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
