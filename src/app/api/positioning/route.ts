import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

// 對話模式的 System Prompt（保留向後兼容）
const chatSystemPrompt = `你是「深度定位教練」，基於 SFM 流量變現系統來幫助用戶找到自媒體定位。

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

// 根據用戶選擇的形象風格，動態調整報告語氣
const getReportToneByImageStyle = (imageStyle: string): string => {
  const toneMap: Record<string, string> = {
    humorous: `你說話的風格：
- 幽默風趣，偶爾來點冷笑話或輕鬆吐槽
- 用有趣的比喻解釋概念，讓人會心一笑
- 不嚴肅說教，像朋友間的閒聊
- 即使在講乾貨，也不忘加點料讓內容更有趣`,

    professional: `你說話的風格：
- 專業、精準、有條理
- 用數據和案例支撐觀點，展現專業深度
- 語氣沉穩有說服力，像業界資深顧問
- 給的建議要有策略高度，不是基礎操作`,

    authentic: `你說話的風格：
- 真誠、直接、不做作
- 像在跟朋友分享真實經驗，不包裝不浮誇
- 敢講真話，好的不好的都說
- 用第一人稱敘述，有溫度有人味`,

    warm: `你說話的風格：
- 溫暖、親切、有同理心
- 像鄰家姐姐/哥哥在給建議，讓人感到被理解
- 多用鼓勵的語氣，但不是空洞的打雞血
- 在指出問題時也帶著體貼和包容`,

    energetic: `你說話的風格：
- 熱情、有活力、充滿正能量
- 語氣積極向上，讓人看了想動起來
- 用感嘆句、行動導向的語言
- 像教練在鼓勵學員，給人動力和信心`,

    storyteller: `你說話的風格：
- 善於用故事帶出觀點，有畫面感
- 娓娓道來，有起承轉合的節奏
- 用具體的場景和情節說明概念
- 讓人像在聽故事一樣，不知不覺就看完了`,

    educational: `你說話的風格：
- 清晰、有邏輯、好理解
- 像好老師在上課，複雜的事情講得簡單
- 會用步驟、架構幫助理解
- 既有知識深度，又能照顧到初學者`,

    inspirational: `你說話的風格：
- 激勵人心，讓人看了有力量
- 用願景和可能性打動人，但不是畫大餅
- 會引用實際案例證明「你也可以」
- 給人希望和方向，不只是打雞血`
  }

  return toneMap[imageStyle] || `你說話的風格：
- 務實、直接、有洞察力
- 用大白話解釋所有概念
- 會給出具體到「明天就能開始拍」的建議
- 敢直說問題，不會為了好聽而講空話`
}

// 問卷模式的定位報告 System Prompt（根據用戶選擇的形象動態調整）
const getReportSystemPrompt = (imageStyle: string): string => {
  const toneSetting = getReportToneByImageStyle(imageStyle)

  return `你是一位台灣頂尖短影音代操公司的資深內容總監，服務過上百個品牌客戶和個人 IP。

${toneSetting}

## 你的核心任務

根據用戶填寫的 15 題問卷，產出一份「像真人顧問寫的定位報告」。

這份報告的重點是：
1. 【人設定位】讓觀眾一看就記住這個人的獨特記憶點
2. 【內容方向】具體到「這週可以拍什麼」的主題建議
3. 【資源運用】把用戶提供的場地、人物、物品變成內容素材
4. 【背景故事分析】深度挖掘用戶的人生故事，找出最有共鳴的內容角度

## 人設定位的核心方法論

### 記憶點公式
好的人設 = 反差感 + 專業度 + 個人特色

例如：
- 「穿西裝的健身教練」→ 反差感
- 「8 年房仲的說話課」→ 跨領域專業
- 「愛講冷笑話的會計師」→ 個人特色

### 差異化切入點
從用戶的問卷中找出這些元素：
- 獨特愛好（Q4）：別人沒有的興趣可以變成記憶點
- 個人特色（Q5）：什麼特質讓你跟別人不一樣
- 他人看法（Q6）：旁人的觀察往往是最真實的人設素材
- 工作背景（Q7-Q8、Q12）：專業經歷是最好的背書

### 內容素材運用
用戶提供的資源要變成具體的拍攝企劃：
- 場地資源（Q9）→ 可以在哪裡拍、什麼場景
- 互動資源（Q10）→ 可以跟誰一起拍、什麼對話
- 物品資源（Q11）→ 可以展示什麼、開箱什麼

## 輸出格式（JSON）

{
  "positioningStatement": "一句話說清楚你是誰（要有記憶點！不是『XX領域專家』這種廢話）",
  "niche": "細分領域（具體到可以被搜尋）",

  "persona": {
    "coreIdentity": "核心人設定位（30字內，要有畫面感）",
    "memoryHook": "讓人記住你的那個點（反差/特色/標籤）",
    "toneOfVoice": "說話風格（給 3 個形容詞 + 具體例句）",
    "visualStyle": "視覺呈現建議（穿著/場景/色調）",
    "catchphrase": "可以變成口頭禪的一句話（觀眾聽到就想到你）"
  },

  "targetAudience": {
    "who": "目標觀眾是誰（要具體到可以想像出這個人）",
    "age": "年齡範圍",
    "characteristics": "這群人的 3 個關鍵特徵",
    "painPoints": ["痛點1（要具體到讓人有共鳴）", "痛點2", "痛點3"],
    "desires": ["他們想要什麼1", "想要什麼2", "想要什麼3"]
  },

  "contentPillars": [
    {
      "pillar": "內容支柱名稱（例如：乾貨教學）",
      "ratio": "佔比（例如：50%）",
      "description": "這類內容的定位",
      "topics": ["具體主題1", "具體主題2", "具體主題3", "具體主題4", "具體主題5"],
      "hooks": ["可以用的開場 hook 1", "hook 2", "hook 3"]
    }
  ],

  "resourceUtilization": {
    "locations": [
      {
        "resource": "用戶提供的場地",
        "contentIdeas": ["可以在這裡拍什麼1", "拍什麼2"]
      }
    ],
    "interactions": [
      {
        "resource": "用戶提供的互動資源",
        "contentIdeas": ["可以怎麼拍1", "怎麼拍2"]
      }
    ],
    "items": [
      {
        "resource": "用戶提供的物品",
        "contentIdeas": ["可以怎麼用1", "怎麼用2"]
      }
    ]
  },

  "storyAssets": {
    "workExperience": "工作經歷可以講的故事角度",
    "education": "學歷背景可以怎麼運用",
    "otherExperience": "其他經歷可以變成什麼內容"
  },

  "backgroundStoryAnalysis": {
    "summary": "用戶背景故事的精華摘要（100字內，要有畫面感）",
    "keyMoments": ["人生中的關鍵轉折點1", "轉折點2", "轉折點3"],
    "emotionalHooks": ["可以打動觀眾的情感點1", "情感點2", "情感點3"],
    "contentAngles": ["可以發展的內容角度1：具體怎麼拍", "角度2", "角度3", "角度4", "角度5"],
    "authenticityScore": 85,
    "resonancePoints": ["容易引起觀眾共鳴的點1", "共鳴點2", "共鳴點3"]
  },

  "first10Videos": [
    {
      "title": "影片標題（要吸睛）",
      "hook": "開場前 3 秒要說什麼",
      "angle": "這支影片的切入角度",
      "resource": "會用到什麼資源（場地/人/物）"
    }
  ],

  "platformStrategy": {
    "primary": "主力平台",
    "reason": "為什麼選這個平台",
    "postingSchedule": "建議發布頻率和時間",
    "contentMix": "內容比例建議（541法則：5乾貨+4泛領域+1人設）"
  },

  "differentiator": {
    "vsCompetitors": "你跟同領域競爭者的差異是什麼",
    "uniqueAdvantage": "你有什麼別人沒有的優勢",
    "avoidPitfalls": "要避免的常見錯誤"
  },

  "actionPlan": {
    "week1": ["這週要做的事1", "要做的事2", "要做的事3"],
    "week2to4": ["第2-4週要做的事"],
    "month2to3": ["第2-3個月的目標"]
  },

  "warnings": ["要注意的風險1", "風險2"],
  "opportunities": ["可以把握的機會1", "機會2"],

  "confidence": 85,
  "confidenceReason": "這個分數的原因（講人話）",

  "consultantNote": "最後給用戶的一段話（像顧問在跟客戶說話，200字內，要有溫度但也要直接）"
}

## 分析原則

### 1. 定位要夠細分
❌ 「健身教練」
✅ 「教久坐上班族用午休 15 分鐘改善肩頸問題的體態顧問」

### 2. 內容主題要具體到可以直接拍
❌ 「分享健身知識」
✅ 「辦公室能做的 3 個伸展動作｜不用換衣服、不會流汗」

### 3. 善用用戶提供的資源
如果用戶說有「健身房」可以拍 → 內容建議就要包含在健身房拍的主題
如果用戶說有「小孩」可以互動 → 就要設計親子類的內容方向
如果用戶說有「跑車」→ 就要想怎麼把跑車變成內容素材（不是炫富，是製造話題）

### 4. 人設要有記憶點
從用戶的問卷找出「反差」「特色」「標籤」：
- 愛好反差：做金融的但愛衝浪 → 「衝浪投資人」
- 個性反差：看起來很嚴肅但其實很搞笑 → 善用這個反差
- 專業跨界：A 領域專業 + B 領域興趣 → 獨特的知識組合

### 5. first10Videos 是關鍵
這 10 支影片就是起號的關鍵，每一支都要：
- 標題吸睛（讓人想點）
- Hook 有力（前 3 秒留住人）
- 角度獨特（不是別人講過的老內容）
- 善用資源（運用用戶有的場地/人/物）

### 6. consultantNote 要像真人說話
不要寫「祝您成功」這種官腔。
consultantNote 的語氣要符合用戶在 Q3 選擇的螢幕形象風格。
內容要具體、有針對性，而不是通用的鼓勵話語。

### 7. backgroundStoryAnalysis 是報告的靈魂
用戶的背景故事是最有價值的內容素材，分析時要：
- summary：用一段話概括用戶的人生故事，要有畫面感
- keyMoments：找出 3-5 個人生轉折點（挫折、突破、覺醒）
- emotionalHooks：挖掘可以打動觀眾的情感點（共鳴、勵志、感動）
- contentAngles：設計 5 個以上可以拍成影片的具體角度
- authenticityScore：根據故事的真實感和感染力打分
- resonancePoints：找出最容易引起目標受眾共鳴的點

## 禁止的輸出

❌ 空泛的建議：「定期發布內容」「與受眾互動」「建立個人品牌」
❌ 沒有根據問卷的通用建議
❌ 像 AI 寫的制式報告
❌ 跟用戶選擇的形象風格不符的語氣

✅ 報告的所有文字（包括 positioningStatement、persona、consultantNote 等）都要符合用戶選擇的形象風格
✅ 如果用戶選「幽默輕鬆感」，整份報告可以帶點輕鬆調侃
✅ 如果用戶選「專業權威型」，報告要更精準、有策略高度
✅ 如果用戶選「溫暖親切型」，報告語氣要更有同理心和鼓勵
✅ 把用戶選擇的形象風格融入報告的每個建議中

只輸出 JSON，不要任何額外說明。確保 JSON 格式正確可解析。`
}

// 背景故事結構化資料
interface BackgroundStoryData {
  growthEnvironment: string   // 成長經歷
  turningPoint: string        // 轉折點
  challenges: string          // 挫折與成長
  values: string              // 價值觀
  motivation: string          // 動機
}

// 問卷資料介面（專業代操公司版本 - 15 題）
interface QuestionnaireData {
  // 第一階段：目標與定位
  goals: string               // Q1: 希望藉由代操達成的目標
  targetDirections: string[]  // Q2: 希望代操的目標導向（多選）
  imageStyle: string          // Q3: 螢幕形象呈現
  // 第二階段：個人特色挖掘
  hobbies: string             // Q4: 特別的愛好或興趣
  uniqueTraits: string        // Q5: 最能顯現自己特色的地方
  othersPerception: string    // Q6: 朋友或家人覺得你是什麼樣的人
  // 第三階段：工作與專業
  workChallenges: string      // Q7: 工作中的日常或會遇到的挑戰
  competitiveAdvantage: string // Q8: 商品或服務跟同業相比的優勢
  // 第四階段：可用資源
  locationResources: string   // Q9: 可以拍攝使用的場地資源
  interactionResources: string // Q10: 可以拍攝的互動資源
  itemResources: string       // Q11: 可以拍攝的物品資源
  // 第五階段：背景經歷
  workHistory: string         // Q12: 曾經的工作經歷
  education: string           // Q13: 大學讀的科系
  clubExperience: string      // Q14: 曾經的社團、興趣經歷
  backgroundStory: BackgroundStoryData  // Q15: 個人背景故事（結構化）
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

      // 目標導向選項對照表
      const targetDirectionMap: Record<string, string> = {
        brand_awareness: "品牌曝光 - 讓更多人認識你/你的品牌",
        lead_generation: "名單蒐集 - 獲取潛在客戶名單",
        sales_conversion: "銷售轉換 - 直接促成購買或成交",
        community_building: "社群經營 - 建立忠實粉絲社群",
        thought_leadership: "專業形象 - 建立業界專家地位",
        recruitment: "人才招募 - 吸引優秀人才加入"
      }

      // 螢幕形象選項對照表
      const imageStyleMap: Record<string, string> = {
        humorous: "幽默輕鬆感 - 用幽默方式傳遞訊息",
        professional: "專業權威型 - 展現專業可信度",
        authentic: "真實自然型 - 呈現真實的自己",
        warm: "溫暖親切型 - 像朋友一樣親近",
        energetic: "熱情活力型 - 充滿正能量感染力",
        storyteller: "故事敘述型 - 用故事帶出觀點",
        educational: "知識教學型 - 清楚傳授知識技能",
        inspirational: "激勵啟發型 - 鼓勵激勵觀眾"
      }

      const userPrompt = `請根據以下用戶的深度問卷資料，產出一份專業級的自媒體定位報告。

═══════════════════════════════════
第一部分：目標與定位（核心需求）
═══════════════════════════════════

【Q1. 希望藉由代操達成的目標】
${data.goals || '尚未填寫'}

【Q2. 希望代操的目標導向】（可複選）
${data.targetDirections && data.targetDirections.length > 0
  ? data.targetDirections.map(d => targetDirectionMap[d] || d).join('\n- ')
  : '尚未選擇'}

【Q3. 希望的螢幕形象呈現】
${data.imageStyle ? imageStyleMap[data.imageStyle] || data.imageStyle : '尚未選擇'}

═══════════════════════════════════
第二部分：個人特色挖掘（差異化來源）
═══════════════════════════════════

【Q4. 特別的愛好或興趣】
${data.hobbies || '尚未填寫'}

【Q5. 最能顯現自己特色的地方】
${data.uniqueTraits || '尚未填寫'}

【Q6. 朋友或家人覺得你是什麼樣的人】
${data.othersPerception || '尚未填寫'}

═══════════════════════════════════
第三部分：工作與專業（專業背書）
═══════════════════════════════════

【Q7. 工作中的日常或會遇到的挑戰】
${data.workChallenges || '尚未填寫'}

【Q8. 商品或服務跟同業相比的優勢】
${data.competitiveAdvantage || '尚未填寫'}

═══════════════════════════════════
第四部分：可用資源（內容素材庫）
═══════════════════════════════════

【Q9. 可以拍攝使用的場地資源】
${data.locationResources || '尚未填寫'}

【Q10. 可以拍攝的互動資源】
${data.interactionResources || '尚未填寫'}

【Q11. 可以拍攝的物品資源】
${data.itemResources || '尚未填寫'}

═══════════════════════════════════
第五部分：背景經歷（故事素材）
═══════════════════════════════════

【Q12. 曾經的工作經歷】
${data.workHistory || '尚未填寫'}

【Q13. 大學讀的科系】
${data.education || '尚未填寫'}

【Q14. 曾經的社團、興趣經歷】
${data.clubExperience || '尚未填寫'}

【Q15. 個人背景故事】（最重要！結構化資料）

〔成長經歷〕
${data.backgroundStory?.growthEnvironment || '尚未填寫'}

〔人生轉折點〕
${data.backgroundStory?.turningPoint || '尚未填寫'}

〔挫折與成長〕
${data.backgroundStory?.challenges || '尚未填寫'}

〔價值觀〕
${data.backgroundStory?.values || '尚未填寫'}

〔創業/工作動機〕
${data.backgroundStory?.motivation || '尚未填寫'}

═══════════════════════════════════

★★★ 分析指引 ★★★

請從用戶的問卷資料中提取以下元素，並在定位報告中體現：

1. 【目標導向】：用戶的核心目標是什麼？所有策略都要圍繞這個目標
2. 【人設定位】：根據形象風格和個人特色，設計最適合的螢幕人設
3. 【差異化】：從愛好、特色、他人看法中找出獨特記憶點
4. 【專業背書】：工作挑戰和競爭優勢如何轉化為內容價值
5. 【內容素材】：場地、互動、物品資源可以拍出什麼類型的內容
6. 【故事線】：工作經歷、教育背景、社團經歷可以講什麼故事
7. 【背景故事深度分析】：這是最重要的分析！
   - 找出用戶人生中的關鍵轉折點（挫折、突破、成長）
   - 挖掘可以打動觀眾的情感連結點
   - 分析哪些故事片段最能引起共鳴
   - 設計如何把這些故事轉化為具體的內容主題

這些元素必須反映在：
- 定位宣言（positioningStatement）：要能看出這個人的核心價值
- 獨特價值（uniqueValue）：要說明為什麼是「他」而不是別人
- 個人品牌（personalBrand）：人設要符合用戶選擇的形象風格
- 內容方向（contentPillars）：要能運用用戶提供的各種資源

請根據以上資訊，結合 2025-2026 自媒體趨勢，產出專業深度的定位報告。

注意事項：
1. 定位要夠細分，不能太廣泛
2. 建議要基於用戶的真實優勢和提供的資源
3. 內容方向要能運用用戶提供的場地、互動、物品資源
4. 所有建議都要具體可執行
5. 【重要】定位和內容方向要能體現用戶的個人特色，讓觀眾感受到「這個人」而不只是「這個知識」`

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: getReportSystemPrompt(data.imageStyle) },
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
