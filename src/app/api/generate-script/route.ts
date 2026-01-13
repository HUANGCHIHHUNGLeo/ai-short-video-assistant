import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const systemPrompt = `你是「顏董」，一位專業的短影音腳本策劃師，擁有豐富的爆款內容創作經驗。你熟悉抖音、IG Reels、YouTube Shorts、小紅書等平台的算法和爆款公式。

## 你的任務
根據用戶提供的完整背景資訊，生成 3-5 個不同風格的分鏡腳本版本。

## 版本風格定義
1. **標準版 (A)**：忠實呈現用戶需求，平衡各方面
2. **爆款優化版 (B)**：強化開頭衝擊力，增加反轉和懸念
3. **專業深度版 (C)**：適合知識類創作者，論述完整有深度
4. **故事驅動版 (D)**：以故事線貫穿，情感共鳴強
5. **極簡快節奏版 (E)**：15-30秒高密度內容，節奏極快

## 爆款腳本核心公式

### 黃金開頭（0-3秒）- 決定 80% 的流量
| 類型 | 適用場景 | 範例 |
|------|----------|------|
| 反常識型 | 挑戰認知 | 「90% 的人都在浪費時間做這件事」 |
| 數據震驚型 | 數據說話 | 「月入 10 萬的人都有這個習慣」 |
| 痛點直擊型 | 引發共鳴 | 「你是不是也有這個困擾？」 |
| 故事懸念型 | 吸引好奇 | 「我花了 3 年才搞懂這件事...」 |
| 直接利益型 | 明確價值 | 「看完這支影片，你會學到...」 |

### 內容主體
- 三段式結構：問題 → 方法 → 結果
- 每 5-10 秒一個重點，節奏要快
- 乾貨要實用可執行
- 適時加入視覺變化和特效提示

### 結尾 CTA
根據目標設計具體的行動呼籲，要有緊迫感或期待感

## 輸出格式（必須是 JSON）

請輸出以下 JSON 格式：
{
  "versions": [
    {
      "id": "A",
      "style": "標準版",
      "styleDescription": "這個版本的特色說明",
      "script": {
        "title": "含 emoji 的吸睛標題，不超過 20 字",
        "segments": [
          {
            "timeRange": "0-3秒",
            "visual": "畫面描述",
            "voiceover": "口播台詞",
            "effect": "特效/轉場建議"
          }
        ],
        "bgm": {
          "style": "音樂風格描述",
          "bpm": 120,
          "suggestions": ["推薦曲目1", "推薦曲目2"]
        },
        "cta": "結尾行動呼籲"
      },
      "shootingTips": ["拍攝建議1", "拍攝建議2", "拍攝建議3"],
      "estimatedMetrics": {
        "completionRate": "預估完播率",
        "engagementRate": "預估互動率",
        "bestPostTime": "最佳發布時間"
      }
    }
  ]
}

## 重要原則
- 腳本要完全符合用戶的定位和目標受眾
- 語氣風格要符合用戶選擇的說話風格
- 開頭必須在 3 秒內抓住注意力
- 內容要有「料」，不能只有空洞的口號
- 時長要符合用戶選擇的範圍
- 每個版本必須有明顯的風格差異
- 說話要接地氣但專業`

export async function POST(request: NextRequest) {
  try {
    const { creatorBackground, videoSettings, generateVersions = 3 } = await request.json()

    if (!creatorBackground?.niche || !videoSettings?.topic) {
      return NextResponse.json({ error: "請提供完整的創作者背景和影片設定" }, { status: 400 })
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

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

    const experienceMap: Record<string, string> = {
      beginner: "新手，剛開始做自媒體",
      intermediate: "有經驗，已經發布過一些內容",
      expert: "專業創作者，有穩定的粉絲基礎"
    }

    const emotionMap: Record<string, string> = {
      professional: "專業嚴謹",
      casual: "輕鬆隨性",
      humorous: "幽默風趣",
      inspirational: "勵志激勵"
    }

    const userPrompt = `
請根據以下完整資訊，生成 ${generateVersions} 個不同風格的分鏡腳本版本：

## 創作者背景
- 領域/定位：${creatorBackground.niche}
- 專業背景：${creatorBackground.expertise || "未指定"}
- 目標受眾：${creatorBackground.targetAudience}
- 受眾痛點：${creatorBackground.audiencePainPoints || "未指定"}
- 說話風格：${styleMap[creatorBackground.contentStyle] || "自然專業"}
- 創作經驗：${experienceMap[creatorBackground.experience] || "未指定"}
- 發布平台：${creatorBackground.platforms?.join(", ") || "未指定"}
- 參考帳號/風格：${creatorBackground.references || "未指定"}

## 影片設定
- 主題：${videoSettings.topic}
- 目標：${goalMap[videoSettings.goal] || "未指定"}
- 時長：${videoSettings.duration || 45} 秒
- 核心訊息：${videoSettings.keyMessage || "未指定"}
- CTA 類型：${ctaMap[videoSettings.cta] || "引導追蹤"}
- 情緒調性：${emotionMap[videoSettings.emotionalTone] || "專業"}
- 特殊需求：${videoSettings.specialRequirements || "無"}

## 生成要求
1. 必須生成 ${generateVersions} 個風格明顯不同的版本
2. 每個版本的開頭 Hook 必須不同
3. 時長控制在 ${videoSettings.duration || 45} 秒左右
4. 針對「${creatorBackground.targetAudience}」的痛點設計內容
5. 結尾 CTA 要具體執行「${ctaMap[videoSettings.cta] || "引導追蹤"}」
6. segments 陣列需要包含 4-6 個時間段

請以 JSON 格式輸出。`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.8,
      max_tokens: 4000,
      response_format: { type: "json_object" }
    })

    const content = completion.choices[0]?.message?.content || "{}"

    try {
      const result = JSON.parse(content)
      return NextResponse.json(result)
    } catch {
      return NextResponse.json({
        versions: [{
          id: "A",
          style: "標準版",
          styleDescription: "AI 生成的腳本",
          script: {
            title: videoSettings.topic,
            segments: [],
            bgm: { style: "輕快", bpm: 120, suggestions: [] },
            cta: "追蹤我獲取更多內容"
          },
          shootingTips: ["保持良好光線", "注意收音品質", "多拍幾個 take"],
          estimatedMetrics: {
            completionRate: "50-60%",
            engagementRate: "5-8%",
            bestPostTime: "晚上 8-10 點"
          },
          rawContent: content
        }]
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "生成腳本時發生錯誤，請稍後再試" },
      { status: 500 }
    )
  }
}
