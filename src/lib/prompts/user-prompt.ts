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
  parts.push(buildGenerationRequirements(generateVersions, targetDuration, minWordCount, maxWordCount))

  // 11. CTA 指引（只載入選中的類型）
  parts.push(getCTAGuide(ctaType))

  // 12. 版本風格建議
  parts.push(generateVersions > 3 ? VERSION_STYLES_EXTENDED : VERSION_STYLES)

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
根據「${niche}」產業，口播內容應該：
- 分享這個領域的實戰經驗和乾貨
- 用具體案例說明，不要講空泛的道理
- 可以講自己遇過的問題、怎麼解決的
- 語氣像在跟同行或有興趣的人聊天`,

    behind_camera: `
## ⚠️ 藏鏡人腳本特別要求（必須遵守！）

### 台灣口吻（絕對禁止大陸用語！）
- ❌「你猜怎麼著」→ ✅「結果咧」「後來呢」
- ❌「咋了」→ ✅「怎麼了」
- ❌「牛逼」→ ✅「猛」「扯」
- 台灣反應詞：「真假」「不會吧」「誇張欸」「傻眼」「扯」

### 根據「${niche}」產業，藏鏡人可以問：
- 這個工作最辛苦/最爽的是什麼？
- 一般人對你們這行最大的誤解是什麼？
- 你們怎麼處理 XXX 問題？
- 入行多久了？當初怎麼開始的？

### 如果是搞笑/幽默類內容：
- 搞笑來自「情境的荒謬」，不是「說笑話」
- 藏鏡人問普通問題，出鏡者的回答帶出荒謬
- 用「反差」製造笑點：認真講蠢事、淡定講崩潰
- 結尾用淡定或無奈的態度收尾（反差＝笑點）
- ❌ 不要解釋為什麼好笑（解釋完就不好笑了）`,

    vlog: `
根據「${niche}」產業，Vlog 應該：
- 記錄這個產業的真實工作日常
- 邊做邊說，展現工作過程
- 可以分享遇到的問題、生活小發現、真實反思

### ⚠️ Vlog 字數句數要求（必須遵守！）
- 30秒：150-180字，10-12句
- 45秒：220-270字，15-18句
- 60秒：300-360字，20-25句
- 目標時長 ${duration} 秒 = 至少 ${Math.round(duration * 4)} 字、${Math.round(duration / 3)} 句以上！`,

    voiceover: `
根據「${niche}」產業，旁白內容應該：
- 用這個產業的真實數據、案例、現象
- 畫面建議要具體
- 旁白節奏要配合畫面切換`,

    acting: `
根據「${niche}」產業，情境劇應該：
- 演出這個產業會遇到的真實情境
- 角色要符合產業特性
- 對話要自然，有衝突、有轉折`,

    tutorial: `
根據「${niche}」產業，教學內容應該：
- 教這個領域的實用技巧或知識
- 步驟要清楚，邊做邊說
- 提醒常見錯誤和注意事項`,

    interview: `
根據「${niche}」產業，訪談應該：
- 問這個產業的專業問題
- 引導受訪者分享經驗和見解
- 問題要有深度，能挖出乾貨`,

    storytime: `
根據「${niche}」產業，故事應該：
- 講這個產業真實發生的故事
- 有起承轉合，有情緒起伏
- 結尾要有啟示或反思`
  }

  return extraGuides[shootingType] || ''
}

function buildWordCountRequirements(duration: number, target: number, min: number, max: number): string {
  return `## ⚠️ 字數要求（最重要！必須遵守！）
- 目標時長：${duration} 秒
- 目標總字數：${target} 字（範圍：${min}-${max} 字）
- 計算方式：每秒 4.5 個字
- 每個 segment 的 voiceover 加起來，必須達到 ${min}-${max} 字！`
}

function buildTitleRequirements(topic: string): string {
  return `## ⚠️ 標題要求（必須遵守！）
- 標題必須圍繞「${topic}」這個主題
- 不能偏離主題自行發揮成其他內容
- 標題要吸睛但必須與主題相關`
}

function buildGenerationRequirements(versions: number, duration: number, min: number, max: number): string {
  return `## 生成要求
1. 生成 ${versions} 個版本，每個版本要用不同的框架和風格
2. ⚠️ 內容必須有價值！有乾貨！
3. ⚠️ 口播內容要像正常台灣人說話！禁止大陸用語（你猜怎麼著、咋了、牛逼、整活等）
4. 開頭 3 秒要能 HOOK 住觀眾
5. 每個版本要有足夠的 segments 來填滿 ${duration} 秒
6. 每段都要有具體的：畫面描述、口播內容、字卡、特效、音效
7. 最終驗證：把所有 voiceover 字數加總，確保達到 ${min}-${max} 字
8. ⚠️ 台灣人反應詞：真假、不會吧、誇張欸、傻眼、扯、靠、天啊`
}
