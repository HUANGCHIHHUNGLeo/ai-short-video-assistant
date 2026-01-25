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

export interface PositioningData {
  positioningStatement?: string
  niche?: string
  uniqueValue?: string
  targetAudience?: {
    who?: string
    age?: string
    characteristics?: string
  }
  painPoints?: string[]
  contentPillars?: Array<{ pillar: string }>
  personalBrand?: {
    tone?: string
  }
  personaTags?: string[]
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
  return `## 已完成的定位分析（重要！請據此設計腳本）
這位創作者已經完成了專業的定位分析，請根據以下定位報告來設計腳本：

- 定位宣言：${data.positioningStatement || ''}
- 細分領域：${data.niche || ''}
- 獨特價值：${data.uniqueValue || ''}
- 目標受眾：${data.targetAudience?.who || ''} (${data.targetAudience?.age || ''})
- 受眾特徵：${data.targetAudience?.characteristics || ''}
- 受眾痛點：${Array.isArray(data.painPoints) ? data.painPoints.join('、') : ''}
- 內容支柱：${Array.isArray(data.contentPillars) ? data.contentPillars.map(p => p.pillar).join('、') : ''}
- 個人品牌風格：${data.personalBrand?.tone || ''}
- 人設關鍵字：${Array.isArray(data.personaTags) ? data.personaTags.join('、') : ''}

請確保腳本：
1. 符合定位宣言的方向
2. 針對指定的目標受眾說話
3. 痛點要戳到他們的真實困擾
4. 使用建議的品牌風格和語調
5. 內容主題符合內容支柱方向`
}

function buildCreatorInfo(bg: CreatorBackground): string {
  return `## 創作者資訊
- 領域：${bg.niche}
- 專業背景：${bg.expertise || "一般素人"}
- 目標觀眾：${bg.targetAudience}
- 觀眾的痛點：${bg.audiencePainPoints || "待挖掘"}
- 說話風格：${getContentStyle(bg.contentStyle || 'friendly')}
- 發布平台：${bg.platforms?.join("、") || "IG/抖音"}`
}

function buildVideoSettings(vs: VideoSettings, duration: number, ctaType: CTAType): string {
  return `## 這支影片的設定
- 主題：${vs.topic}
- 目標：${getVideoGoal(vs.goal || 'awareness')}
- 時長：${duration} 秒
- 核心訊息：${vs.keyMessage || "待定"}
- CTA：${getCTAGuide(ctaType).split('\n')[0]}
- 情緒：${getEmotionalTone(vs.emotionalTone || 'calm')}`
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
根據「${niche}」產業，藏鏡人可以問：
- 這個工作最辛苦/最爽的是什麼？
- 一般人對你們這行最大的誤解是什麼？
- 你們怎麼處理 XXX 問題？
- 入行多久了？當初怎麼開始的？`,

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
3. ⚠️ 口播內容要像正常台灣人說話！
4. 開頭 3 秒要能 HOOK 住觀眾
5. 每個版本要有足夠的 segments 來填滿 ${duration} 秒
6. 每段都要有具體的：畫面描述、口播內容、字卡、特效、音效
7. 最終驗證：把所有 voiceover 字數加總，確保達到 ${min}-${max} 字`
}
