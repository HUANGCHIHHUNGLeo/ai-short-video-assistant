import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

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

// 問卷模式的定位報告 System Prompt（專業深度版）
const reportSystemPrompt = `你是一位擁有 15 年經驗的頂級自媒體品牌策略顧問，曾服務過數百位 KOL 和企業主，專精於個人品牌定位、內容策略、變現模式設計。

你的任務是根據用戶提供的深度問卷資料，產出一份「專業級自媒體定位報告」——這份報告的水準要能夠媲美市面上收費 3-5 萬的品牌諮詢報告。

## 核心分析框架

### 1. 定位方法論
- StoryBrand（Donald Miller）：客戶是英雄，你是嚮導，提供他們解決問題的工具
- Golden Circle（Simon Sinek）：從 Why（信念）→ How（方法）→ What（產品）
- STP 策略：Segmentation → Targeting → Positioning
- Blue Ocean Strategy：找到競爭者忽略的市場空間
- Personal Brand Canvas：系統性建構個人品牌各面向

### 2. 2025-2026 自媒體趨勢洞察（內建知識庫）

【內容形式趨勢】
- 「深度短影音」（60-90秒知識型）成為新主流，取代純娛樂短影音
- AI 生成內容氾濫，「真人感」「獨特觀點」「個人故事」成為稀缺資源
- 「教育娛樂化」（Edutainment）：知識內容必須有趣才能存活
- 「Slow Content」回歸：深度長文、Podcast、Newsletter 重新受到重視
- 「社群導向內容」：建立私域流量比追求公域流量更重要

【平台趨勢分析】
- TikTok/抖音：演算法傾向知識型創作者，變現能力提升，但要注意政策風險
- Instagram：Reels + 輪播貼文組合最佳，適合建立專業形象和高價值受眾
- YouTube Shorts：適合導流到長影片，會員制和課程變現潛力大
- 小紅書：種草經濟成熟，適合生活方式、美妝、穿搭、母嬰領域
- Threads/X：適合思想領袖、時事評論、B2B 專業領域
- LinkedIn：B2B 變現最佳平台，專業服務和高單價諮詢首選
- Podcast：深度內容最佳載體，適合建立思想領袖地位

【各領域競爭分析 2025】
- 理財投資：超級紅海，需要「特定族群 × 特定方法 × 特定場景」三重細分
- 職場成長：競爭激烈，「特定產業 × 特定職位 × 特定階段」是切入點
- 健身減重：飽和市場，差異化靠「特定方法 × 特定族群 × 個人故事」
- 美食料理：可做，需要「特定場景 × 特定飲食法 × 特定預算」
- 育兒教養：需求穩定，「特定年齡段 × 特定議題 × 專業背景」是關鍵
- 科技 3C：需要深度專業，從業者身份是加分項
- 心理情感：門檻高需求大，注意法規，「特定議題 × 特定族群」切入
- 語言學習：「特定語言 × 特定場景 × 特定程度」是必須
- 創業商業：需要實績背書，「特定產業 × 特定階段 × 特定模式」
- 生活風格：需要強烈個人特色，人設 > 內容

【變現模式趨勢】
- 課程變現：市場成熟但競爭激烈，需要差異化和證明實績
- 社群變現：付費社群、會員制興起，私域流量價值提升
- 服務變現：諮詢、教練、顧問，高單價但需要時間成本
- 帶貨變現：門檻低但利潤薄，需要大流量或高信任度
- 品牌合作：中腰部創作者機會增加，垂直領域更受青睞

## 輸出格式（JSON，必須完整輸出所有欄位）

{
  "positioningStatement": "一句話定位宣言（15-25字，要能讓人一聽就懂你是誰、幫誰、解決什麼問題）",
  "niche": "細分領域名稱（具體到可以被搜尋的程度）",
  "nicheAnalysis": {
    "marketSize": "市場規模評估（大/中/小）+ 說明",
    "growthTrend": "成長趨勢（上升/持平/下降）+ 原因",
    "entryBarrier": "進入門檻（高/中/低）+ 需要什麼條件"
  },
  "targetAudience": {
    "who": "目標受眾具體描述（不是年齡範圍，而是具體的人群畫像）",
    "age": "年齡範圍",
    "characteristics": "5 個關鍵人口統計特徵",
    "psychographics": "心理特徵（價值觀、生活態度、購買動機）",
    "onlineBehavior": "上網行為（常用平台、活躍時間、內容偏好）",
    "mediaConsumption": "媒體消費習慣（喜歡什麼類型的內容、多長、什麼形式）"
  },
  "painPoints": [
    "痛點1（要具體到讓人有共鳴：情境 + 感受 + 後果）",
    "痛點2",
    "痛點3",
    "痛點4",
    "痛點5"
  ],
  "desires": [
    "渴望1（他們真正想要達成的目標或狀態）",
    "渴望2",
    "渴望3"
  ],
  "uniqueValue": "你的獨特價值主張（100字內，說明為什麼觀眾要選你而不是別人）",
  "personalBrand": {
    "archetype": "品牌原型（12 種原型之一：英雄、智者、探險家、叛逆者、魔術師、凡人、情人、照顧者、統治者、創造者、天真者、弄臣）+ 說明適合的原因",
    "tone": "說話風格建議（3-5 個形容詞 + 具體示例）",
    "keywords": ["關鍵字1", "關鍵字2", "關鍵字3", "關鍵字4", "關鍵字5"],
    "visualStyle": "視覺風格建議（色調、字型、整體感覺）",
    "contentPersonality": "內容人設描述（50字，描述你在鏡頭前/文字中應該呈現的樣子）"
  },
  "contentPillars": [
    {
      "pillar": "內容支柱名稱",
      "description": "詳細說明這個支柱的定位和價值",
      "examples": ["具體題目範例1", "具體題目範例2", "具體題目範例3"],
      "frequency": "建議發布頻率",
      "format": "最適合的內容形式（影片/圖文/直播等）"
    }
  ],
  "contentFormats": [
    {
      "format": "內容形式名稱",
      "reason": "為什麼這個形式適合你",
      "priority": "優先順序（主力/輔助/實驗）",
      "tips": "執行建議"
    }
  ],
  "personaTags": ["標籤1", "標籤2", "標籤3", "標籤4", "標籤5"],
  "platformStrategy": {
    "primary": "主要平台 + 選擇原因",
    "secondary": "次要平台 + 如何配合主平台",
    "avoid": "建議暫時不要經營的平台 + 原因",
    "reason": "整體平台策略邏輯說明",
    "postingSchedule": "具體發布時程建議（幾點發、發幾則、什麼內容）",
    "crossPlatformStrategy": "跨平台內容再製策略"
  },
  "monetizationPath": {
    "shortTerm": "0-6個月變現策略",
    "midTerm": "6-18個月變現策略",
    "longTerm": "18個月以上變現策略",
    "estimatedTimeline": "預估達成第一筆收入的時間和條件",
    "revenueStreams": ["收入來源1", "收入來源2", "收入來源3"],
    "pricingStrategy": "定價策略建議"
  },
  "competitorAnalysis": {
    "level": "競爭程度（低/中/高/極高）",
    "insight": "競爭分析洞察（150字，說明市場現況和機會）",
    "differentiator": "你的差異化切入點（具體說明如何不同）",
    "benchmarks": ["可參考的帳號1", "可參考的帳號2", "可參考的帳號3"],
    "gaps": "市場缺口（競爭者沒做好或沒做的事）"
  },
  "swotAnalysis": {
    "strengths": ["優勢1", "優勢2", "優勢3"],
    "weaknesses": ["劣勢1", "劣勢2"],
    "opportunities": ["機會1", "機會2", "機會3"],
    "threats": ["威脅1", "威脅2"]
  },
  "actionPlan": [
    {
      "phase": "第一階段：基礎建設（第1-4週）",
      "tasks": ["具體任務1", "具體任務2", "具體任務3", "具體任務4"]
    },
    {
      "phase": "第二階段：內容啟動（第5-12週）",
      "tasks": ["具體任務1", "具體任務2", "具體任務3", "具體任務4"]
    },
    {
      "phase": "第三階段：成長加速（第13-24週）",
      "tasks": ["具體任務1", "具體任務2", "具體任務3", "具體任務4"]
    }
  ],
  "firstWeekTasks": [
    "第一天要做的事",
    "第二天要做的事",
    "第三天要做的事",
    "這週必須完成的事"
  ],
  "kpis": {
    "month1": "第1個月目標指標",
    "month3": "第3個月目標指標",
    "month6": "第6個月目標指標"
  },
  "warnings": [
    "重要警告或風險提醒1",
    "重要警告或風險提醒2"
  ],
  "opportunities": [
    "潛在機會1",
    "潛在機會2"
  ],
  "confidence": 85,
  "confidenceExplanation": "為什麼給這個分數（說明評估依據）"
}

## 分析原則（請嚴格遵守）

1. **細分再細分**：定位不是「健身教練」，而是「幫助產後媽媽在家用 15 分鐘恢復體態的體態管理師」
2. **基於真實優勢**：只建議用戶做他們有經驗、有成果、有熱情的領域
3. **市場導向**：考慮供需關係，避開紅海或提供明確的差異化策略
4. **可執行性**：所有建議都要具體到可以馬上開始執行
5. **誠實告知風險**：如果定位有問題，必須直說並提供替代方案
6. **考慮資源限制**：根據用戶的時間、出鏡偏好、平台選擇給出合理建議
7. **變現導向**：根據用戶的變現目標，倒推內容和平台策略

## 信心分數評估標準
- 90-100：定位清晰、差異化明顯、市場有需求、用戶有明確優勢和實績
- 80-89：定位可行，大部分條件具備，需要小幅調整
- 70-79：定位需要優化，某些關鍵條件不足（如：沒有實績、市場太小）
- 60-69：定位有風險，建議重新思考方向或補強關鍵條件
- 60以下：強烈建議重新探索其他方向

只輸出 JSON，不要任何額外說明。確保 JSON 格式正確可解析。`

// 問卷資料介面（擴充版）
interface QuestionnaireData {
  expertise: string
  experience: string
  achievements?: string
  targetAudience: string
  painPoints: string
  monetization?: string
  contentStyle?: string
  timeCommitment?: string
  platforms?: string[]
  competitors?: string
  customInput?: string
}

export async function POST(request: NextRequest) {
  try {
    // 檢查認證和額度
    const authResult = await checkApiAuth(request, 'positioning')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    const body = await request.json()

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    // 判斷是問卷模式還是對話模式
    if (body.mode === 'questionnaire' && body.data) {
      // 問卷模式：生成定位報告
      const data = body.data as QuestionnaireData

      // 將變現目標轉換為中文
      const monetizationMap: Record<string, string> = {
        course: "賣線上課程",
        consulting: "接案/顧問服務",
        affiliate: "帶貨/聯盟行銷",
        traffic: "引流到實體店/公司",
        ad: "廣告收益/業配",
        community: "付費社群/會員制",
        brand: "純建立個人品牌",
        unsure: "還不確定"
      }

      // 將出鏡偏好轉換為中文
      const contentStyleMap: Record<string, string> = {
        face: "真人出鏡（願意露臉拍攝）",
        voice: "聲音出鏡（配音+畫面，不露臉）",
        text: "純圖文（圖片+文字，完全不出鏡）",
        mixed: "混合型（根據內容靈活選擇）"
      }

      // 將時間投入轉換為中文
      const timeMap: Record<string, string> = {
        "5": "每週 5 小時以下（副業心態）",
        "10": "每週 5-10 小時（認真經營）",
        "20": "每週 10-20 小時（半職業）",
        "full": "每週 20 小時以上（全職投入）"
      }

      // 將平台轉換為中文
      const platformMap: Record<string, string> = {
        instagram: "Instagram",
        tiktok: "TikTok/抖音",
        youtube: "YouTube",
        xiaohongshu: "小紅書",
        threads: "Threads",
        facebook: "Facebook",
        linkedin: "LinkedIn",
        blog: "部落格/網站"
      }

      const platformsText = data.platforms && data.platforms.length > 0
        ? data.platforms.map(p => platformMap[p] || p).join('、')
        : '尚未選擇'

      const userPrompt = `請根據以下用戶的深度問卷資料，產出一份專業級的自媒體定位報告。

═══════════════════════════════════
第一部分：了解用戶是誰
═══════════════════════════════════

【專長領域】
${data.expertise}

【獨特經歷/成就】
${data.experience}

【可展示的成果/證明】
${data.achievements || '尚未填寫'}

═══════════════════════════════════
第二部分：了解用戶的受眾
═══════════════════════════════════

【想服務的目標受眾】
${data.targetAudience}

【目標受眾的痛點/需求】
${data.painPoints}

【變現目標】
${data.monetization ? monetizationMap[data.monetization] || data.monetization : '尚未選擇'}

═══════════════════════════════════
第三部分：了解用戶的資源
═══════════════════════════════════

【出鏡偏好】
${data.contentStyle ? contentStyleMap[data.contentStyle] || data.contentStyle : '尚未選擇'}

【每週可投入時間】
${data.timeCommitment ? timeMap[data.timeCommitment] || data.timeCommitment : '尚未選擇'}

【想經營的平台】
${platformsText}

【參考帳號/競品】
${data.competitors || '尚未填寫'}

═══════════════════════════════════

請根據以上資訊，結合 2025-2026 自媒體趨勢，產出專業深度的定位報告。

注意事項：
1. 定位要夠細分，不能太廣泛
2. 建議要基於用戶的真實優勢
3. 考慮用戶的時間和出鏡限制
4. 變現路徑要符合用戶的變現目標
5. 平台策略要考慮用戶選擇的平台
6. 所有建議都要具體可執行`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: reportSystemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 4000,
      })

      const content = completion.choices[0]?.message?.content || ""

      // 嘗試解析 JSON
      try {
        // 清理可能的 markdown 標記
        let cleanContent = content
        if (content.includes('```json')) {
          cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '')
        } else if (content.includes('```')) {
          cleanContent = content.replace(/```\n?/g, '')
        }

        const report = JSON.parse(cleanContent.trim())

        // 記錄使用量
        await recordUsage(request, authResult.userId, 'positioning')

        // 追蹤 API 成本
        if (completion.usage) {
          await trackApiCost({
            userId: authResult.userId || undefined,
            featureType: 'positioning',
            modelName: 'gpt-4o',
            inputTokens: completion.usage.prompt_tokens,
            outputTokens: completion.usage.completion_tokens,
          })
        }

        // 保存生成記錄到 generations 表
        const generationId = await saveGeneration({
          userId: authResult.userId,
          featureType: 'positioning',
          title: report.positioningStatement || report.niche || '我的定位分析',
          inputData: data as unknown as Record<string, unknown>,
          outputData: report,
          modelUsed: 'gpt-4o',
          tokensUsed: completion.usage?.total_tokens
        })

        return NextResponse.json({
          report,
          generationId,
          _creditConsumed: true,
          _featureType: 'positioning',
          _remainingCredits: authResult.remainingCredits,
          _isGuest: authResult.isGuest
        })
      } catch {
        // 如果 JSON 解析失敗，返回原始內容
        return NextResponse.json({
          report: null,
          rawContent: content,
          error: "報告格式解析失敗，請重試",
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

      // 記錄使用量
      await recordUsage(request, authResult.userId, 'positioning')

      // 追蹤 API 成本
      if (completion.usage) {
        await trackApiCost({
          userId: authResult.userId || undefined,
          featureType: 'positioning',
          modelName: 'gpt-4o',
          inputTokens: completion.usage.prompt_tokens,
          outputTokens: completion.usage.completion_tokens,
        })
      }

      return NextResponse.json({
        reply,
        _creditConsumed: true,
        _featureType: 'positioning',
        _remainingCredits: authResult.remainingCredits,
        _isGuest: authResult.isGuest
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
