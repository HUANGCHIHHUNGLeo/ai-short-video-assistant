// Prompt 模組化 - 主組裝函數
// 根據用戶選擇動態組合 prompt，減少 token 消耗
//
// 模組架構：
// - core.ts: 核心心法（價值內容原則）
// - taiwan-style.ts: 台灣口語化規則
// - cta-guides.ts: CTA 類型指引
// - styles.ts: 風格/情緒/目標
// - shooting-types.ts: 8 種拍攝類型指引
// - user-prompt.ts: 動態組合 user prompt
// - output-format.ts: JSON 輸出格式
// - frameworks.ts: 腳本框架列表

import { SHOOTING_TYPES, DEFAULT_SHOOTING_TYPE } from './shooting-types'
import { FRAMEWORKS_LIST } from './frameworks'
import { OUTPUT_FORMAT } from './output-format'
import { CORE_PRINCIPLES, EMOTION_CURVE, HOOK_TECHNIQUES } from './core'
import { TAIWAN_STYLE, FORBIDDEN_WORDS } from './taiwan-style'

export interface BuildPromptOptions {
  shootingType: string      // 'talking_head' | 'behind_camera' | 'voiceover' | 'acting' | 'vlog' | 'tutorial' | 'interview' | 'storytime'
  includeFrameworks?: boolean  // 是否包含框架列表（讓 AI 自選）
  minimal?: boolean         // 最小化模式（省略範例，只保留規則）
}

/**
 * 建構 system prompt
 *
 * 優化前：~6000 字（全部內容 + 重複）
 * 優化後：~2000-2500 字（模組化載入）
 *
 * @param options - 拍攝類型等選項
 * @returns 組裝好的 system prompt
 */
export function buildSystemPrompt(options: BuildPromptOptions): string {
  const { shootingType, includeFrameworks = true, minimal = false } = options

  // 取得對應的拍攝類型指引
  const shootingTypePrompt = SHOOTING_TYPES[shootingType] || SHOOTING_TYPES[DEFAULT_SHOOTING_TYPE]

  const parts = [
    // 核心模組（必載）
    CORE_PRINCIPLES,         // ~300 字：角色 + 價值內容原則
    TAIWAN_STYLE,            // ~200 字：台灣口語化
    FORBIDDEN_WORDS,         // ~300 字：禁止清單

    // 技巧模組（可選）
    !minimal ? HOOK_TECHNIQUES : null,  // ~200 字：開頭技巧
    !minimal ? EMOTION_CURVE : null,    // ~150 字：情緒曲線

    // 拍攝類型（動態載入）
    shootingTypePrompt,      // ~200-400 字：只送選中的拍攝類型

    // 框架列表（可選）
    includeFrameworks ? FRAMEWORKS_LIST : null,  // ~100 字

    // 輸出格式（必載）
    OUTPUT_FORMAT,           // ~400 字：JSON 格式定義
  ]

  return parts.filter(Boolean).join('\n\n')
}

// === 匯出所有模組 ===

// 核心模組
export { CORE_PRINCIPLES, EMOTION_CURVE, HOOK_TECHNIQUES } from './core'

// 台灣口語化模組
export { TAIWAN_STYLE, FORBIDDEN_WORDS, RHYTHM_EXAMPLES } from './taiwan-style'

// CTA 指引模組
export { CTA_GUIDES, CTA_GENERAL_PRINCIPLES, getCTAGuide } from './cta-guides'
export type { CTAType } from './cta-guides'

// 風格/情緒模組
export {
  CONTENT_STYLES,
  EMOTIONAL_TONES,
  VIDEO_GOALS,
  CAST_COUNTS,
  getContentStyle,
  getEmotionalTone,
  getVideoGoal,
  getCastCount,
  VERSION_STYLES,
  VERSION_STYLES_EXTENDED
} from './styles'
export type { ContentStyle, EmotionalTone, VideoGoal } from './styles'

// User Prompt 組合
export { buildUserPrompt } from './user-prompt'
export type { CreatorBackground, VideoSettings, PositioningData, BuildUserPromptOptions } from './user-prompt'

// 拍攝類型
export { SHOOTING_TYPES, DEFAULT_SHOOTING_TYPE } from './shooting-types'

// 框架
export { FRAMEWORKS, FRAMEWORKS_LIST } from './frameworks'

// 輸出格式
export { OUTPUT_FORMAT } from './output-format'
