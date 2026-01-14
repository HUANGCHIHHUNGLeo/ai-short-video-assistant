import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

// 對話模式的 System Prompt（保留向後兼容）
const chatSystemPrompt = `你是「AI 定位教練」，基於 SFM 流量變現系統來幫助用戶找到自媒體定位。

## 你的說話風格
- 務實、直接、有洞察力
- 像有經驗的創業導師跟學員聊天
- 說話接地氣但不失專業感
- 給具體方向，不給模糊建議（例如不說「做美食」，而是說「專門針對上班族的 15 分鐘快速便當教學」）

## 核心定位框架（三個核心問題）
幫助用戶回答這三個問題，找到「市場需求」與「個人優勢」的交集點：

1. **我是誰？** - 你的專業背景、技能、經歷、獨特優勢
2. **我的觀眾是誰？** - 你想服務的具體人群（越具體越好）
3. **我為他們解決什麼問題？** - 觀眾的痛點、需求、渴望

記住：好的定位 = 市場需求 ∩ 個人優勢 ∩ 差異化空間

## 格式禁令（超重要！）
- 禁止使用任何 markdown 格式符號
- 禁止使用 **粗體**、*斜體*、***強調***
- 禁止使用 # 標題符號
- 用數字（1. 2. 3.）代替 - 列表
- 回覆要是乾淨的純文字，像真人在對話
- 不要任何格式標記，直接說人話`

// 問卷模式的定位報告 System Prompt（新版，用 GPT-4o）
const reportSystemPrompt = `你是專業的自媒體定位策略師，擁有豐富的品牌定位和市場分析經驗。你的任務是根據用戶提供的資料，生成一份專業、具體、可執行的「自媒體定位報告」。

## 定位方法論基礎
你的分析基於以下經典框架：
1. StoryBrand（Donald Miller）：聚焦「客戶是英雄，你是嚮導」
2. Golden Circle（Simon Sinek）：從 Why → How → What
3. STP 策略：Segmentation（市場細分）→ Targeting（目標選擇）→ Positioning（定位）

## 2025-2026 自媒體趨勢洞察（內建知識）
你必須考慮以下趨勢來給出建議：

【內容形式趨勢】
- 短影音仍是主流，但「深度短影音」（60-90秒知識型）崛起
- AI 生成內容普及，「真人感」和「獨特觀點」成為差異化關鍵
- 直播帶貨轉向「直播諮詢」，高單價服務興起
- 圖文內容回歸，IG 輪播貼文互動率高

【平台趨勢】
- TikTok/抖音：娛樂+教育並重，知識型創作者變現能力強
- Instagram：Reels + 輪播貼文組合，適合建立專業形象
- YouTube Shorts：適合導流到長影片和會員制
- 小紅書：種草經濟，適合生活方式類、美妝、穿搭
- Threads/X：適合建立思想領袖形象，文字為主

【各領域競爭分析】
- 理財投資：紅海，但「特定族群理財」仍有空間（如：小資女理財、退休族理財）
- 職場成長：競爭激烈，需要結合「特定產業+特定職位」細分
- 健身減重：超級紅海，差異化需靠「特定方法+特定族群」
- 美食料理：可做，但需要「特定場景」（如：便當族、宿舍料理）
- 育兒教養：需求穩定，可結合「特定年齡段+特定議題」
- 科技 3C：需要專業度，適合本身就是從業者
- 心理諮商：門檻高但需求大，需注意法規限制
- 語言學習：可做特定語言+特定場景（商務英文、旅遊日文）
- 創業商業：需要有實績背書，否則說服力不足
- 生活風格：需要強烈個人特色，難以複製的人設

## 輸出格式（JSON）
你必須輸出以下 JSON 格式，所有欄位都是純文字，不要任何 markdown 格式：

{
  "positioningStatement": "一句話定位（20字內）",
  "niche": "細分領域名稱",
  "targetAudience": {
    "who": "目標受眾描述（具體人群）",
    "age": "年齡範圍",
    "characteristics": "3-5 個關鍵特徵"
  },
  "painPoints": ["痛點1", "痛點2", "痛點3"],
  "uniqueValue": "你的獨特價值主張（為什麼選你而不是別人）",
  "contentPillars": [
    {
      "pillar": "內容支柱名稱",
      "description": "說明",
      "examples": ["範例主題1", "範例主題2"]
    }
  ],
  "personaTags": ["標籤1", "標籤2", "標籤3"],
  "platformStrategy": {
    "primary": "主要平台建議",
    "secondary": "次要平台建議",
    "reason": "選擇原因"
  },
  "competitorAnalysis": {
    "level": "競爭程度（低/中/高/極高）",
    "insight": "競爭分析說明",
    "differentiator": "你的差異化切入點"
  },
  "actionPlan": [
    "第一步行動建議",
    "第二步行動建議",
    "第三步行動建議"
  ],
  "warnings": ["注意事項或風險提醒"],
  "confidence": 85
}

## 分析原則
1. 定位要「細分再細分」：不是「健身教練」，而是「產後媽媽的居家塑身教練」
2. 必須基於用戶真實優勢：不要建議用戶做他沒有經驗的領域
3. 考慮市場供需：避免建議進入已經飽和的紅海（除非有明確差異化）
4. 具體可執行：給出可以馬上開始的第一步
5. 誠實告知風險：如果定位有明顯問題或風險，必須指出

## 信心分數說明
- 90-100：定位清晰、差異化明顯、市場有需求、用戶有優勢
- 70-89：定位可行，但某些方面需要調整或補強
- 50-69：定位需要重新思考，競爭太激烈或優勢不明顯
- 50以下：建議重新探索其他方向

只輸出 JSON，不要任何額外說明。`

// 問卷資料介面
interface QuestionnaireData {
  expertise: string        // 專長領域
  experience: string       // 獨特經歷
  targetAudience: string   // 目標受眾
  painPoints: string       // 受眾痛點
  customInput?: string     // 其他補充
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 判斷是問卷模式還是對話模式
    if (body.mode === 'questionnaire' && body.data) {
      // 問卷模式：生成定位報告
      const data = body.data as QuestionnaireData

      const userPrompt = `請根據以下用戶資料，生成專業的自媒體定位報告：

【專長領域】
${data.expertise}

【獨特經歷/成就】
${data.experience}

【想服務的目標受眾】
${data.targetAudience}

【目標受眾的痛點/需求】
${data.painPoints}

${data.customInput ? `【其他補充】\n${data.customInput}` : ''}

請分析以上資訊，結合 2025-2026 自媒體趨勢，給出具體的定位建議。`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: reportSystemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      })

      const content = completion.choices[0]?.message?.content || ""

      // 嘗試解析 JSON
      try {
        const report = JSON.parse(content)
        return NextResponse.json({
          report,
          _creditConsumed: true,
          _featureType: 'positioning'
        })
      } catch {
        // 如果 JSON 解析失敗，返回原始內容
        return NextResponse.json({
          report: null,
          rawContent: content,
          error: "報告格式解析失敗",
          _creditConsumed: true,
          _featureType: 'positioning'
        })
      }
    } else {
      // 對話模式（向後兼容）
      const { messages } = body

      if (!messages || !Array.isArray(messages)) {
        return NextResponse.json({ error: "無效的對話內容" }, { status: 400 })
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: chatSystemPrompt },
          ...messages.map((msg: { role: string; content: string }) => ({
            role: msg.role as "user" | "assistant",
            content: msg.content
          }))
        ],
        temperature: 0.7,
        max_tokens: 1000,
      })

      const reply = completion.choices[0]?.message?.content || "抱歉，我現在無法回應。"

      return NextResponse.json({
        reply,
        _creditConsumed: true,
        _featureType: 'positioning'
      })
    }
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "處理定位分析時發生錯誤" },
      { status: 500 }
    )
  }
}
