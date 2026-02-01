// User Prompt 動態組合模組
// 根據用戶選擇動態組合 user prompt，移除重複內容

import { getContentStyle, getEmotionalTone, getVideoGoal, getCastCount, VERSION_STYLES, VERSION_STYLES_EXTENDED } from './styles'
import { getCTAGuide, CTA_GENERAL_PRINCIPLES, type CTAType } from './cta-guides'
import { SHOOTING_TYPES } from './shooting-types'

export interface CreatorBackground {
  niche: string
  expertise?: string
  targetAudience: string
  audiencePainPoints?: string
  contentStyle?: string
  platforms?: string[]
}

export interface VideoSettings {
  topic: string
  goal?: string
  duration?: number
  keyMessage?: string
  cta?: string
  emotionalTone?: string
  shootingType?: string
  castCount?: string
  specialRequirements?: string
  // 藏鏡人專用：價值輸出相關
  valuePoints?: string       // 這支影片要傳達的核心知識/價值點
  storyToShare?: string      // 出鏡者要分享的故事/經驗
  keyTakeaway?: string       // 觀眾看完應該學到什麼
}

// 完整的定位報告類型（對應 /api/positioning 的輸出）
export interface PositioningData {
  positioningStatement?: string
  niche?: string
  uniqueValue?: string

  // 人設定位
  persona?: {
    coreIdentity?: string
    memoryHook?: string
    toneOfVoice?: string
    visualStyle?: string
    catchphrase?: string
  }

  // 目標受眾
  targetAudience?: {
    who?: string
    age?: string
    characteristics?: string
    painPoints?: string[]
    desires?: string[]
  }

  // 內容支柱（完整版）
  contentPillars?: Array<{
    pillar: string
    ratio?: string
    description?: string
    topics?: string[]
    hooks?: string[]
  }>

  // 資源運用
  resourceUtilization?: {
    locations?: Array<{ resource: string; contentIdeas?: string[] }>
    interactions?: Array<{ resource: string; contentIdeas?: string[] }>
    items?: Array<{ resource: string; contentIdeas?: string[] }>
  }

  // 故事素材
  storyAssets?: {
    workExperience?: string
    education?: string
    otherExperience?: string
  }

  // 背景故事分析（最重要！）
  backgroundStoryAnalysis?: {
    summary?: string
    keyMoments?: string[]
    emotionalHooks?: string[]
    contentAngles?: string[]
    resonancePoints?: string[]
  }

  // 前 10 支影片建議
  first10Videos?: Array<{
    title?: string
    hook?: string
    angle?: string
    resource?: string
  }>

  // 差異化
  differentiator?: {
    vsCompetitors?: string
    uniqueAdvantage?: string
    avoidPitfalls?: string
  }

  // 個人品牌（向後兼容）
  personalBrand?: {
    tone?: string
  }

  // 其他欄位
  personaTags?: string[]
  painPoints?: string[]
  consultantNote?: string
}

export interface BuildUserPromptOptions {
  creatorBackground: CreatorBackground
  videoSettings: VideoSettings
  generateVersions?: number
  positioningData?: PositioningData
}

/**
 * 建構 user prompt
 * 根據用戶選擇動態組合，只載入需要的內容
 *
 * @param options - 創作者背景、影片設定等
 * @returns 組裝好的 user prompt
 */
export function buildUserPrompt(options: BuildUserPromptOptions): string {
  const { creatorBackground, videoSettings, generateVersions = 3, positioningData } = options

  // 計算目標字數
  const targetDuration = videoSettings.duration || 45
  const targetWordCount = Math.round(targetDuration * 5.5)
  const minWordCount = Math.round(targetWordCount * 0.85)
  const maxWordCount = Math.round(targetWordCount * 1.15)

  const shootingType = videoSettings.shootingType || 'talking_head'
  const ctaType = (videoSettings.cta || 'follow') as CTAType

  // 組合各區塊
  const parts: (string | null)[] = []

  // 1. 基本請求
  parts.push(`請幫我生成 ${generateVersions} 個不同風格的短影音腳本：`)

  // 2. 定位資料（如果有）
  if (positioningData) {
    parts.push(buildPositioningContext(positioningData))
  }

  // 3. 創作者資訊
  parts.push(buildCreatorInfo(creatorBackground))

  // 4. 影片設定
  parts.push(buildVideoSettings(videoSettings, targetDuration, ctaType))

  // 5. 拍攝規格
  parts.push(buildShootingSpecs(videoSettings))

  // 6. 產業客製化指引
  parts.push(buildIndustryGuide(creatorBackground.niche))

  // 7. 拍攝類型特別指引（只載入選中的類型）
  parts.push(buildShootingTypeGuide(shootingType, creatorBackground.niche, targetDuration))

  // 8. 字數要求
  parts.push(buildWordCountRequirements(targetDuration, targetWordCount, minWordCount, maxWordCount))

  // 9. 標題要求
  parts.push(buildTitleRequirements(videoSettings.topic))

  // 10. 生成要求（精簡版）
  parts.push(buildGenerationRequirements(generateVersions, targetDuration, minWordCount, maxWordCount, shootingType))

  // 11. CTA 指引（只載入選中的類型）
  parts.push(getCTAGuide(ctaType))

  // 12. 版本風格建議（藏鏡人有專屬風格）
  if (shootingType === 'behind_camera') {
    parts.push(`版本風格建議（每個版本都要是藏鏡人兩人對話格式！）：
- 版本 A：知識分享版 - 藏鏡人代替觀眾提問，出鏡者分享專業乾貨（「欸這個怎麼做的？」→ 出鏡者詳細講解）
- 版本 B：搞笑日常版 - 藏鏡人用日常問題引出荒謬回答，反差製造笑點
- 版本 C：故事挖掘版 - 藏鏡人用追問引出出鏡者的真實經歷和轉折故事
${generateVersions > 3 ? `- 版本 D：吐槽互動版 - 藏鏡人邊吐槽邊提問，出鏡者自嘲回應
- 版本 E：街訪風格版 - 藏鏡人像路人一樣隨機提問，出鏡者即興回答` : ''}

⚠️ 重要：每個版本的 voiceover 都必須是【藏鏡人】和【出鏡者】的對話！不能寫成單人口播！`)
  } else {
    parts.push(generateVersions > 3 ? VERSION_STYLES_EXTENDED : VERSION_STYLES)
  }

  // 13. JSON 格式提示
  parts.push('請用 JSON 格式輸出。')

  return parts.filter(Boolean).join('\n\n')
}

// === 輔助函數 ===

function buildPositioningContext(data: PositioningData): string {
  const parts: string[] = []

  // 標題
  parts.push(`## ⚠️ 專業定位報告（最重要！必須完全遵循！）
這位創作者已完成專業定位分析，以下是完整報告。腳本內容必須100%基於這份報告來設計！`)

  // 1. 核心定位
  parts.push(`### 核心定位
- 定位宣言：${data.positioningStatement || ''}
- 細分領域：${data.niche || ''}
- 獨特價值：${data.uniqueValue || ''}`)

  // 2. 人設定位（新增！）
  if (data.persona) {
    parts.push(`### 人設定位（說話方式要符合！）
- 核心人設：${data.persona.coreIdentity || ''}
- 記憶點：${data.persona.memoryHook || ''}
- 說話風格：${data.persona.toneOfVoice || ''}
- 視覺風格：${data.persona.visualStyle || ''}
- 口頭禪：${data.persona.catchphrase || ''}`)
  }

  // 3. 目標受眾（完整版）
  if (data.targetAudience) {
    const ta = data.targetAudience
    let audienceText = `### 目標受眾（對這群人說話！）
- 是誰：${ta.who || ''} (${ta.age || ''})
- 特徵：${ta.characteristics || ''}`

    if (ta.painPoints && ta.painPoints.length > 0) {
      audienceText += `\n- 痛點：${ta.painPoints.join('、')}`
    } else if (data.painPoints && data.painPoints.length > 0) {
      audienceText += `\n- 痛點：${data.painPoints.join('、')}`
    }

    if (ta.desires && ta.desires.length > 0) {
      audienceText += `\n- 渴望：${ta.desires.join('、')}`
    }
    parts.push(audienceText)
  }

  // 4. 背景故事分析（最重要！）
  if (data.backgroundStoryAnalysis) {
    const story = data.backgroundStoryAnalysis
    let storyText = `### ⚠️ 創作者的背景故事（腳本的核心素材！）`

    if (story.summary) {
      storyText += `\n【故事摘要】\n${story.summary}`
    }

    if (story.keyMoments && story.keyMoments.length > 0) {
      storyText += `\n\n【人生轉折點】（可以拍成故事的素材！）\n${story.keyMoments.map((m, i) => `${i + 1}. ${m}`).join('\n')}`
    }

    if (story.emotionalHooks && story.emotionalHooks.length > 0) {
      storyText += `\n\n【情感共鳴點】\n${story.emotionalHooks.map((h, i) => `${i + 1}. ${h}`).join('\n')}`
    }

    if (story.contentAngles && story.contentAngles.length > 0) {
      storyText += `\n\n【可拍攝的內容角度】\n${story.contentAngles.map((a, i) => `${i + 1}. ${a}`).join('\n')}`
    }

    if (story.resonancePoints && story.resonancePoints.length > 0) {
      storyText += `\n\n【共鳴點】\n${story.resonancePoints.join('、')}`
    }

    parts.push(storyText)
  }

  // 5. 故事素材
  if (data.storyAssets) {
    const assets = data.storyAssets
    let assetsText = `### 故事素材庫`
    if (assets.workExperience) assetsText += `\n- 工作經歷可講的：${assets.workExperience}`
    if (assets.education) assetsText += `\n- 學歷背景可用的：${assets.education}`
    if (assets.otherExperience) assetsText += `\n- 其他經歷可變成的內容：${assets.otherExperience}`
    if (assetsText !== `### 故事素材庫`) {
      parts.push(assetsText)
    }
  }

  // 6. 內容支柱（完整版）
  if (data.contentPillars && data.contentPillars.length > 0) {
    let pillarsText = `### 內容支柱（主題要符合這些方向！）`
    data.contentPillars.forEach((pillar, i) => {
      pillarsText += `\n\n【${pillar.pillar}】${pillar.ratio ? `（${pillar.ratio}）` : ''}`
      if (pillar.description) pillarsText += `\n${pillar.description}`
      if (pillar.topics && pillar.topics.length > 0) {
        pillarsText += `\n具體主題：${pillar.topics.join('、')}`
      }
      if (pillar.hooks && pillar.hooks.length > 0) {
        pillarsText += `\n開場 Hook：${pillar.hooks.slice(0, 2).join(' / ')}`
      }
    })
    parts.push(pillarsText)
  }

  // 7. 資源運用
  if (data.resourceUtilization) {
    const res = data.resourceUtilization
    let resText = `### 可運用的資源`

    if (res.locations && res.locations.length > 0) {
      resText += `\n【場地】`
      res.locations.forEach(loc => {
        resText += `\n- ${loc.resource}`
        if (loc.contentIdeas && loc.contentIdeas.length > 0) {
          resText += `：可拍 ${loc.contentIdeas.join('、')}`
        }
      })
    }

    if (res.interactions && res.interactions.length > 0) {
      resText += `\n【互動資源】`
      res.interactions.forEach(int => {
        resText += `\n- ${int.resource}`
        if (int.contentIdeas && int.contentIdeas.length > 0) {
          resText += `：可拍 ${int.contentIdeas.join('、')}`
        }
      })
    }

    if (res.items && res.items.length > 0) {
      resText += `\n【物品】`
      res.items.forEach(item => {
        resText += `\n- ${item.resource}`
        if (item.contentIdeas && item.contentIdeas.length > 0) {
          resText += `：可拍 ${item.contentIdeas.join('、')}`
        }
      })
    }

    if (resText !== `### 可運用的資源`) {
      parts.push(resText)
    }
  }

  // 8. 前 10 支影片參考
  if (data.first10Videos && data.first10Videos.length > 0) {
    let videosText = `### 參考主題（定位報告建議的影片方向）`
    data.first10Videos.slice(0, 5).forEach((video, i) => {
      videosText += `\n${i + 1}. ${video.title || ''}`
      if (video.hook) videosText += ` | Hook: ${video.hook}`
    })
    parts.push(videosText)
  }

  // 9. 差異化優勢
  if (data.differentiator) {
    const diff = data.differentiator
    let diffText = `### 差異化優勢`
    if (diff.vsCompetitors) diffText += `\n- 跟競爭者的差異：${diff.vsCompetitors}`
    if (diff.uniqueAdvantage) diffText += `\n- 獨特優勢：${diff.uniqueAdvantage}`
    if (diff.avoidPitfalls) diffText += `\n- 要避免的錯誤：${diff.avoidPitfalls}`
    if (diffText !== `### 差異化優勢`) {
      parts.push(diffText)
    }
  }

  // 10. 個人品牌風格（向後兼容）
  if (data.persona?.toneOfVoice || data.personalBrand?.tone) {
    parts.push(`### 說話風格
${data.persona?.toneOfVoice || data.personalBrand?.tone || ''}`)
  }

  // 11. 強調使用規則
  parts.push(`### ⚠️ 使用定位報告的規則
1. 腳本主題必須符合「內容支柱」的方向
2. 說話方式必須符合「人設定位」的風格
3. 如果有「背景故事」，腳本要基於這些真實經歷
4. 痛點要對應「目標受眾」的真實困擾
5. 可以參考「前10支影片」的主題方向
6. 善用「資源」來設計畫面和場景
7. 不可以自己編造定位報告中沒有的故事！`)

  return parts.join('\n\n')
}

function buildCreatorInfo(bg: CreatorBackground): string {
  // 檢查是否有提供個人經歷/背景故事
  const hasPersonalStory = bg.expertise && bg.expertise.length > 10

  let info = `## 創作者資訊
- 領域：${bg.niche}
- 目標觀眾：${bg.targetAudience}
- 觀眾的痛點：${bg.audiencePainPoints || "待挖掘"}
- 說話風格：${getContentStyle(bg.contentStyle || 'friendly')}
- 發布平台：${bg.platforms?.join("、") || "IG/抖音"}`

  // 如果有個人經歷，特別強調這是腳本素材
  if (hasPersonalStory) {
    info += `

## ⚠️ 創作者的真實經歷（重要！必須使用！）
${bg.expertise}

### 這是腳本的核心素材！
- 腳本內容必須基於上面這段真實經歷
- 不可以自己編造其他故事或案例
- 數字、細節、過程都要符合創作者提供的內容
- 如果創作者說「虧了50萬」，腳本就要講「虧了50萬」，不能改成其他金額或情境`
  } else {
    info += `
- 專業背景：${bg.expertise || "一般素人"}`
  }

  return info
}

function buildVideoSettings(vs: VideoSettings, duration: number, ctaType: CTAType): string {
  const hasKeyMessage = vs.keyMessage && vs.keyMessage.length > 5

  let settings = `## 這支影片的設定
- 主題：${vs.topic}
- 目標：${getVideoGoal(vs.goal || 'awareness')}
- 時長：${duration} 秒
- CTA：${getCTAGuide(ctaType).split('\n')[0]}
- 情緒：${getEmotionalTone(vs.emotionalTone || 'calm')}`

  // 如果有核心訊息，強調這是必須傳達的重點
  if (hasKeyMessage) {
    settings += `

## ⚠️ 這支影片必須傳達的核心訊息
「${vs.keyMessage}」

腳本內容要圍繞這個核心訊息來設計，確保觀眾看完能記住這個重點。`
  }

  // 價值輸出相關欄位（所有拍攝類型都適用）
  if (vs.valuePoints && vs.valuePoints.length > 5) {
    settings += `

## ⚠️⚠️⚠️ 這支影片必須傳達的核心價值/知識（最重要！）
${vs.valuePoints}

腳本的 voiceover 內容必須圍繞以上價值點來設計！
每個 segment 都要有具體的乾貨、數字、方法，不能空泛！
${vs.shootingType === 'behind_camera' ? '藏鏡人的問題要引導出鏡者講出這些價值點！' : ''}`
  }

  if (vs.storyToShare && vs.storyToShare.length > 5) {
    settings += `

## ⚠️ 必須融入腳本的故事/經驗（不能自己編！）
${vs.storyToShare}

腳本內容要自然帶入以上故事，用故事來傳達價值！
不能自己編造其他故事，要用上面提供的真實經歷！
具體的數字、時間、過程要保留，這些才是讓觀眾信服的關鍵！`
  }

  if (vs.keyTakeaway && vs.keyTakeaway.length > 5) {
    settings += `

## ⚠️ 觀眾看完這支影片應該學到什麼
${vs.keyTakeaway}

整支影片要圍繞這個學習目標！
到最後一段，觀眾要能明確知道這個重點。`
  }

  return settings
}

function buildShootingSpecs(vs: VideoSettings): string {
  const shootingType = vs.shootingType || 'talking_head'
  const shootingTypeDesc: Record<string, string> = {
    talking_head: "口播型 - 真人出鏡對著鏡頭說話",
    behind_camera: "藏鏡人 - 一人在鏡頭後提問，另一人出鏡回答",
    voiceover: "純配音 - 只有聲音旁白，畫面是素材",
    acting: "演戲/情境劇 - 有劇情、角色、對話",
    vlog: "Vlog - 生活記錄風格，邊走邊拍邊說",
    tutorial: "教學示範 - 邊做邊說，步驟清楚",
    interview: "訪談/對談 - 兩人以上正式對話",
    storytime: "說故事 - 敘事型，有起承轉合"
  }

  return `## 拍攝規格（重要！）
- 拍攝類型：${shootingTypeDesc[shootingType] || shootingTypeDesc.talking_head}
- 演員人數：${getCastCount(vs.castCount || 'solo')}
- 特殊需求：${vs.specialRequirements || "無"}`
}

function buildIndustryGuide(niche: string): string {
  return `## ⚠️ 根據「${niche}」產業設計腳本內容
這位創作者是「${niche}」領域的，腳本內容要：
- 展現這個產業的專業知識和日常
- 用這個產業的真實情境和案例
- 解決這個產業目標受眾的真實問題
- 說話方式符合這個產業的調性`
}

function buildShootingTypeGuide(shootingType: string, niche: string, duration: number): string {
  // 從 shooting-types.ts 取得對應的指引
  const guide = SHOOTING_TYPES[shootingType]
  if (!guide) return ''

  // 為特定類型加入額外的產業客製化指引
  const extraGuides: Record<string, string> = {
    talking_head: `
## ⚠️ 口播型腳本品質要求

### voiceover 格式
- 就是一個人自然說話，像在跟朋友聊天
- 每段 voiceover 至少 40-70 字，不能只有一兩句！
- 要有語氣詞：「其實」「說真的」「重點是」「然後」「對啊」
- 要有停頓感：用句號斷句，不要一長串

### 根據「${niche}」產業，口播內容應該：
- 分享這個領域的實戰經驗和乾貨
- 用具體案例、數字、真實經歷，不要講空泛的道理
- 可以講自己遇過的問題、怎麼解決的
- 語氣像在跟同行或有興趣的人聊天

### ❌ 禁止 AI 味的寫法（違反重寫！）
- ❌「在這個...的時代」「隨著...的發展」
- ❌「那是我人生最低谷的時刻，負債累累，前途未卜」（太文藝太書面）
- ❌「我開始改變思維，學會銷售技巧」（太空泛，講了跟沒講一樣）
- ✅ 要這樣寫：「那時候我欠了四百萬，每天睡覺前都在算還要還多久。後來我做了一件事...」

### 口播最終檢查
- ✅ 每句話讀出來是否自然？台灣人真的會這樣講話嗎？
- ✅ 有沒有具體的數字、案例、方法？（不能只有情緒沒有內容）
- ✅ voiceover 總字數是否達標？`,

    behind_camera: `
## ⚠️⚠️⚠️ 藏鏡人腳本 - 最重要的規則（違反直接重寫！）

### 🔴 核心原則：出鏡者 = 價值輸出者！（不是只在閒聊！）
藏鏡人腳本的本質 = 透過對話來傳遞有價值的內容
- 藏鏡人代替觀眾提問，引導出鏡者講出「乾貨」
- 出鏡者每一次回答都要有「具體的知識、經驗、數字、方法」
- 不是一問一答各一句話就結束！出鏡者要多講！要展開！要有內容！
- ⚠️ 如果出鏡者的回答只有一句話（例如「對啊」「是這樣」），這段就是失敗的！

### 🔴 voiceover 欄位格式（絕對不能寫成單人口播！）
藏鏡人的 voiceover 必須是兩人對話格式：
- 用【藏鏡人】和【出鏡者】標籤區分說話者
- 每個 segment 的 voiceover 要包含 2-4 輪問答
- 對話要自然，像兩個朋友在聊天
- 藏鏡人負責提問、追問、吐槽、反應（短句！）
- 出鏡者負責回答、分享經驗、給乾貨（要長！要有內容！）

### ⚠️⚠️⚠️ 每段 voiceover 字數 = 時長 × 4.5 字（必須遵守！）
- 每秒鐘中文口語大約 4-5 個字
- 如果一段 segment 是 10 秒，voiceover 至少要 45 字（兩人對話加總）
- 如果一段 segment 是 15 秒，voiceover 至少要 65 字
- ❌ 絕對不能一段 10 秒的 segment 只寫 20 個字！那只夠講 4 秒！
- ⚠️ 最常見的錯誤：藏鏡人問一句、出鏡者答一句就結束 → 字數嚴重不足！
- ✅ 正確做法：藏鏡人問 → 出鏡者詳細回答（至少 30-50 字）→ 藏鏡人追問 → 出鏡者補充

### 出鏡者回答的標準（必須做到！）：
1. 每次回答至少 30-50 字，不能只有一句話！
2. 要包含具體的：數字、方法、步驟、案例、經驗
3. 要用創作者提供的真實故事和經歷
4. 觀眾看完要覺得「學到東西了」「有收穫」

### voiceover 正確格式範例（注意出鏡者回答的長度！）：
"【藏鏡人】：欸你當初怎麼會想做這個？\\n【出鏡者】：其實是被逼的啦，公司倒了，那時候負債快兩百萬，每天睡覺前都在算還要還多久。後來有天看到一個做短影音的，三個月從零做到十萬粉，我就想說試試看。\\n【藏鏡人】：蛤？就這樣開始的？\\n【出鏡者】：對啊，第一支影片拍了五個小時，剪了三天，上傳之後三個人看，其中兩個是我媽跟我自己。"

❌ 錯誤格式（出鏡者回答太短！沒有價值！）：
"【藏鏡人】：你怎麼開始的？\\n【出鏡者】：就突然想做。\\n【藏鏡人】：然後咧？\\n【出鏡者】：然後就開始了。"
↑ 這種一句話回答 = 沒有價值輸出 = 不合格！

### segment 結構（不要用 HOOK-CONTENT-CTA 框架！）
藏鏡人腳本要用「問答輪次」結構：
- 第 1 段（segmentName: "開場提問"）：藏鏡人丟出第一個問題引發好奇
- 第 2-4 段（segmentName: "第X輪問答"）：每輪一個主題，藏鏡人追問＋出鏡者回答
- 最後段（segmentName: "收尾"）：藏鏡人總結或出鏡者給 CTA

### 台灣口吻（絕對禁止大陸用語！）
- ❌「你猜怎麼著」→ ✅「結果咧」「後來呢」
- ❌「咋了」→ ✅「怎麼了」
- ❌「牛逼」→ ✅「猛」「扯」
- 藏鏡人反應詞：「真假」「不會吧」「誇張欸」「傻眼」「扯」「蛤？」「然後咧？」「有沒有搞錯」

### 根據「${niche}」產業，藏鏡人可以問：
- 這個工作最辛苦/最爽的是什麼？
- 一般人對你們這行最大的誤解是什麼？
- 你們怎麼處理 XXX 問題？
- 入行多久了？當初怎麼開始的？
- 做這行遇過最扯的事是什麼？

### 如果是搞笑/幽默類內容：
- 搞笑來自「情境的荒謬」，不是「說笑話」
- 藏鏡人問普通問題，出鏡者的回答帶出荒謬
- 用「反差」製造笑點：認真講蠢事、淡定講崩潰
- 結尾用淡定或無奈的態度收尾（反差＝笑點）
- ❌ 不要解釋為什麼好笑（解釋完就不好笑了）`,

    vlog: `
## ⚠️ Vlog 腳本品質要求

### voiceover 格式
- 像在自言自語、碎念、跟觀眾聊天
- 每段 voiceover 至少 40-60 字，Vlog 不是三言兩語就結束！
- 句子要短，一句一個想法
- 可以有 murmur、OS、突然的感想

### 根據「${niche}」產業，Vlog 應該：
- 記錄這個產業的真實工作日常
- 邊做邊說，展現工作過程中的細節
- 分享遇到的問題、生活小發現、真實反思
- 穿插小知識或行業 inside 給觀眾

### ⚠️ Vlog 字數句數要求（必須遵守！）
- 30秒：150-180字，10-12句
- 45秒：220-270字，15-18句
- 60秒：300-360字，20-25句
- 目標時長 ${duration} 秒 = 至少 ${Math.round(duration * 4)} 字、${Math.round(duration / 3)} 句以上！

### ❌ Vlog 禁止 AI 味
- ❌「今天要來分享我的一天」（太刻意）
- ❌「在這個忙碌的早晨」（太文藝）
- ✅「早上六點，又是開店的一天。先把機器預熱，等水溫到 93 度。」

### Vlog 最終檢查
- ✅ 字數句數是否達標？（最常被忽略！）
- ✅ 是否有日常細節和感受？不是流水帳？
- ✅ 結尾有沒有跟內容相關的 CTA？`,

    voiceover: `
## ⚠️ 純配音腳本品質要求

### voiceover 格式
- 旁白語氣，像在跟觀眾說故事或講解
- 每段 voiceover 至少 40-60 字
- 每 3-5 秒要切換一次畫面（visual 要寫具體！）
- 用「你看」「就是這個」「重點來了」引導視線

### 根據「${niche}」產業，旁白內容應該：
- 用這個產業的真實數據、案例、現象
- 畫面建議要具體（❌「相關畫面」→ ✅「手機滑動畫面」「咖啡倒入杯中特寫」）
- 旁白節奏要配合畫面切換，重點處放慢

### ❌ 純配音禁止 AI 味
- ❌「在當今社會中，越來越多人開始關注...」
- ❌「讓我們來看看這個問題」
- ✅「你有沒有算過，每天一杯拿鐵，一年花多少錢？答案是一萬五。」

### 純配音最終檢查
- ✅ 每段都有具體的 visual 描述嗎？（不能只寫「相關畫面」）
- ✅ 旁白跟畫面是對應的嗎？
- ✅ 字數達標嗎？`,

    acting: `
## ⚠️ 演戲/情境劇腳本品質要求

### voiceover 格式（必須用角色標籤！）
- 用【角色名】標示每個人的台詞，例如【主管】【員工】【客人】
- 動作用（）標示，表情要寫清楚
- 每段 voiceover 至少 50-80 字（含所有角色的台詞）

### voiceover 正確格式範例：
"【主管】：（拍桌）這個提案誰做的？\\n【員工】：（緊張）是...是我。\\n【主管】：你過來。\\n（員工慢慢走過去，其他同事投以同情眼光）\\n【主管】：（突然笑）做得太好了。\\n【員工】：蛤？"

### 根據「${niche}」產業，情境劇應該：
- 演出這個產業會遇到的真實情境
- 角色要符合產業特性
- 對話要自然，有衝突、有轉折
- 一定要有翻轉或反差（這是爆款關鍵）

### ❌ 情境劇禁止 AI 味
- ❌ 對話太書面語（「我認為這個方案需要調整」→ ✅「這什麼東西啊」）
- ❌ 沒有衝突或轉折（太平淡沒人想看）
- ❌ 結尾沒有情緒收尾

### 情境劇最終檢查
- ✅ voiceover 是否都用【角色名】標示？
- ✅ 有沒有衝突和轉折？
- ✅ 對話是否自然口語？台灣人會這樣講嗎？`,

    tutorial: `
## ⚠️ 教學型腳本品質要求

### voiceover 格式
- 邊做邊說的教學語氣
- 每段 voiceover 至少 40-70 字
- 步驟不超過 3 個（短影片記不住太多）
- 用「注意這裡」「很多人會錯在這」「重點來了」提醒

### 根據「${niche}」產業，教學內容應該：
- 教這個領域具體可操作的技巧或知識
- 步驟要清楚，邊做邊說，畫面要能看到操作
- 每個步驟都要說「為什麼」不只是「怎麼做」
- 提醒常見錯誤（「很多人以為...其實...」）

### ❌ 教學禁止 AI 味
- ❌「首先，讓我們來了解...」（太像簡報）
- ❌「第一步，我們需要準備材料」（太刻意）
- ✅「手機拍照總是模糊？問題可能出在這裡。第一，長按螢幕鎖定對焦。很多人只是點一下，手一晃就跑焦了。」

### 教學最終檢查
- ✅ 教的東西觀眾能馬上用嗎？
- ✅ 有沒有說「為什麼」要這樣做？
- ✅ visual 有沒有寫具體的操作畫面？`,

    interview: `
## ⚠️ 訪談型腳本品質要求

### voiceover 格式（必須用角色標籤！）
- 用【主持人】和【受訪者】標示對話
- 每段 voiceover 至少 50-80 字（含兩人對話）
- 主持人的話要簡短，不要搶受訪者的話
- 受訪者的回答要有具體內容和故事

### voiceover 正確格式範例：
"【主持人】：你當初為什麼會辭掉工作去創業？\\n【受訪者】：其實是被逼的。公司倒了，找不到工作。\\n【主持人】：所以不是夢想，是沒選擇？\\n【受訪者】：對，一開始真的是為了活下去。"

### 根據「${niche}」產業，訪談應該：
- 問這個產業的專業問題，能挖出乾貨
- 引導受訪者分享真實經歷和反思
- 問題有層次：事實 → 感受 → 啟發
- 會追問：「然後呢？」「為什麼？」「可以說具體一點嗎？」

### ❌ 訪談禁止 AI 味
- ❌「請問您對這個行業的看法是什麼？」（太官方、太空泛）
- ❌ 主持人講太多（主角是受訪者）
- ✅「你做這行最崩潰的一次是什麼？」（具體、有畫面）

### 訪談最終檢查
- ✅ voiceover 是否都用【主持人】【受訪者】標示？
- ✅ 受訪者的回答有沒有乾貨和故事？
- ✅ 有沒有追問？（不能一問一答就結束）`,

    storytime: `
## ⚠️ 說故事型腳本品質要求

### voiceover 格式
- 第一人稱敘事，像在跟朋友講一件事
- 每段 voiceover 至少 40-70 字
- 要有具體細節：時間、地點、人物、對話
- 情緒起伏要明顯，用語速和停頓控制節奏

### 根據「${niche}」產業，故事應該：
- 講這個產業真實發生的故事
- 有起承轉合，高潮要有衝擊力
- 結尾要有啟示或反轉（不能平淡收尾）
- 用具體細節營造畫面感（「凌晨三點」比「很晚」更有感覺）

### ❌ 說故事禁止 AI 味
- ❌「那是我人生最低谷的時刻，負債累累，前途未卜」（太文藝太書面）
- ❌「我開始改變思維，學會了很多」（太空泛，講了等於沒講）
- ✅「那天老闆叫我進辦公室，我以為完蛋了。結果他說...」（有畫面、有懸念）
- ✅「欠了四百萬，每天睡前都在算還要還多久。直到有一天...」（有具體數字、有情緒）

### 說故事最終檢查
- ✅ 有沒有具體的時間、地點、人物？
- ✅ 高潮或轉折夠不夠有衝擊力？
- ✅ 結尾有啟示嗎？觀眾看完能得到什麼？`
  }

  return extraGuides[shootingType] || ''
}

function buildWordCountRequirements(duration: number, target: number, min: number, max: number): string {
  const segmentCount = duration <= 30 ? 4 : duration <= 60 ? 5 : 6
  const perSegmentMin = Math.round(min / segmentCount)

  return `## ⚠️ 字數要求（最重要！必須遵守！違反要重寫！）
- 目標時長：${duration} 秒
- 目標總字數：${target} 字（範圍：${min}-${max} 字）
- 計算方式：每秒約 4.5 個中文字
- 建議 ${segmentCount} 個 segments，每個 segment 的 voiceover 平均 ${perSegmentMin}+ 字
- ⚠️ 每個 segment 的 voiceover 不能只有一兩句話！至少要 ${perSegmentMin} 字以上！
- ⚠️ 每段 voiceover 字數 ≈ 該段秒數 × 4.5 字（例如 10 秒的段落至少 45 字！）
- ⚠️ 最終驗證：把所有 segment 的 voiceover 字數加總，必須達到 ${min}-${max} 字
- ❌ 最常見的錯誤：一段 10 秒的 segment 只寫 15-20 字 → 這只夠講 3-4 秒！嚴重不足！
- ✅ 正確做法：如果字數不夠，要增加具體的乾貨、故事細節、數字案例！不要加廢話水字！`
}

function buildTitleRequirements(topic: string): string {
  return `## ⚠️ 標題要求（必須遵守！）
- 標題必須圍繞「${topic}」這個主題
- 不能偏離主題自行發揮成其他內容
- 標題要吸睛但必須與主題相關`
}

function buildGenerationRequirements(versions: number, duration: number, min: number, max: number, shootingType: string = 'talking_head'): string {
  let requirements = `## 生成要求
1. 生成 ${versions} 個版本，每個版本要用不同的框架和風格
2. ⚠️ 每段 voiceover 都要有「價值輸出」！觀眾看完要覺得學到東西！
3. ⚠️ 價值輸出 = 具體的數字、真實的案例、可執行的方法、親身的故事！
4. ⚠️ 像正常台灣人說話！禁止大陸用語（你猜怎麼著、咋了、牛逼、整活等）
5. 開頭 3 秒要能 HOOK 住觀眾（禁止用「大家好」「今天要來分享」開場）
6. 每個版本要有足夠的 segments 來填滿 ${duration} 秒
7. ⚠️ 每段 voiceover 字數 ≈ 段落秒數 × 4.5！10 秒至少 45 字，15 秒至少 65 字！
8. ⚠️ 不能一段 voiceover 只有一兩句話（15-20 字）就結束！那連 5 秒都講不完！
9. 每段都要有具體的：畫面描述、口播內容、字卡、特效、音效
10. ⚠️ 最終驗證：把所有 voiceover 字數加總，確保達到 ${min}-${max} 字
11. ⚠️ 台灣語氣詞：真假、不會吧、誇張欸、傻眼、扯、靠、天啊、其實、說真的、重點是

## ⚠️⚠️⚠️ 禁止 AI 味！（最重要的規則！）
你寫出來的每一句 voiceover，都要像是一個真人在說話，不是 AI 在寫作文！

### AI 味的特徵（全部禁止！）：
- ❌ 太文藝：「那是我人生最低谷的時刻，負債累累，前途未卜」
- ❌ 太空泛：「我開始改變思維，學會了很多」（講了等於沒講）
- ❌ 太書面：「在這個競爭激烈的時代」「隨著科技的發展」
- ❌ 太簡報：「首先...其次...最後...」「讓我們來看看」
- ❌ 太短太敷衍：一段 voiceover 只有一句話就結束
- ❌ 只有情緒沒有內容：「創業很辛苦對吧？但只要堅持就會成功！」

### 正確的寫法（要這樣！每一段都要有價值！）：
- ✅ 有具體故事：「那時候我欠了四百萬，每天睡覺前都在算還要還多久。最慘的時候連房租都付不出來，跟朋友借了三次，第四次人家已經不接電話了」
- ✅ 有因果邏輯：「後來我改了一件事：每天打 50 通電話。你知道前兩週成交幾個嗎？零個。但我繼續打，第一個月成交 3 個，第二個月 8 個，第三個月開始有人主動找我了」
- ✅ 有方法步驟：「很多人問我怎麼做到的，其實就三步：第一，先把你的成本結構全部列出來。第二，找到你毛利最高的三個品項。第三，把行銷預算全部集中在這三個品項上」
- ✅ 有 insight：「一般人以為創業最難的是找資金，其實不是。最難的是你找到客戶之後，怎麼讓他第二次還來。回購率才是決定你能不能活下去的關鍵」
- ✅ 有反差對比：「我以前月薪三萬的時候，每個月存五千覺得很辛苦。後來我學會一個觀念之後，同樣月薪三萬，我一個月可以存一萬五」`

  // 藏鏡人專用生成要求
  if (shootingType === 'behind_camera') {
    requirements += `

## ⚠️ 藏鏡人腳本最終檢查（必須全部通過！）
- ✅ 每段 voiceover 是否都有【藏鏡人】和【出鏡者】的對話？（沒有的話重寫！）
- ✅ 藏鏡人是否用短句提問？（不能講長篇大論）
- ✅ 出鏡者每次回答是否至少 30-50 字？（一句話就結束 = 不合格！）
- ✅ 出鏡者回答是否有「具體的數字、方法、步驟、案例」？（不能空泛！）
- ✅ 每段 voiceover 總字數是否 ≥ 該段秒數 × 4.5？（10秒至少45字！）
- ✅ 對話是否自然？像朋友聊天而不是主持人訪問？
- ✅ 是否用了台灣口語？（蛤、真假、然後咧、不會吧、誇張欸）
- ✅ segmentName 是否用問答輪次（開場提問、第X輪問答、收尾）而不是 HOOK/CONTENT/CTA？
- ✅ 觀眾看完是否學到東西？出鏡者有沒有傳達出有價值的內容？
- ❌ 如果任何 voiceover 看起來像單人口播，必須重寫成兩人對話！
- ❌ 如果出鏡者的回答只有一兩句話、沒有展開，必須補充到 30-50 字以上！`
  }

  // 演戲/情境劇專用生成要求
  if (shootingType === 'acting') {
    requirements += `

## ⚠️ 演戲/情境劇腳本最終檢查（必須全部通過！）
- ✅ 每段 voiceover 是否都有【角色名】標籤？（如【主管】【員工】【客人】等）
- ✅ 角色動作和表情是否用（）標示？（如（拍桌）（緊張）（翻白眼））
- ✅ 情節有沒有衝突和轉折？（平淡 = 沒人看）
- ✅ 對話是否自然口語？台灣人會這樣講話嗎？
- ✅ 結尾是否有反差或情緒收尾？
- ❌ 如果 voiceover 沒有角色標籤、看起來像旁白，必須重寫成角色對話！`
  }

  // 訪談型專用生成要求
  if (shootingType === 'interview') {
    requirements += `

## ⚠️ 訪談型腳本最終檢查（必須全部通過！）
- ✅ 每段 voiceover 是否都有【主持人】和【受訪者】標籤？
- ✅ 主持人的問題是否簡短有力？（不要長篇大論搶話）
- ✅ 受訪者的回答有沒有具體內容、故事、數字？（不能空泛）
- ✅ 有沒有追問？（一問一答就結束 = 太淺）
- ✅ 問題有層次嗎？（事實 → 感受 → 啟發）
- ❌ 如果 voiceover 沒有角色標籤、看起來像單人口播，必須重寫成兩人對話！`
  }

  return requirements
}
