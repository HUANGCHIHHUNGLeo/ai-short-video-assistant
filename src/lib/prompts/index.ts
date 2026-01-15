// Prompt 模組化 - 主組裝函數
// 根據用戶選擇動態組合 prompt，減少 token 消耗

import { BASE_PROMPT } from './base'
import { SHOOTING_TYPES, DEFAULT_SHOOTING_TYPE } from './shooting-types'
import { FRAMEWORKS_LIST } from './frameworks'
import { OUTPUT_FORMAT } from './output-format'

export interface BuildPromptOptions {
  shootingType: string      // 'talking_head' | 'voiceover' | 'acting' | 'vlog' | 'tutorial' | 'interview' | 'storytime'
  includeFrameworks?: boolean  // 是否包含框架列表（讓 AI 自選）
}

/**
 * 建構 system prompt
 *
 * 優化前：~3500 字（全部內容）
 * 優化後：~900-1000 字（只有必要內容）
 *
 * @param options - 拍攝類型等選項
 * @returns 組裝好的 system prompt
 */
export function buildSystemPrompt(options: BuildPromptOptions): string {
  const { shootingType, includeFrameworks = true } = options

  // 取得對應的拍攝類型指引，如果沒有就用預設
  const shootingTypePrompt = SHOOTING_TYPES[shootingType] || SHOOTING_TYPES[DEFAULT_SHOOTING_TYPE]

  const parts = [
    BASE_PROMPT,           // ~400 字：角色 + 自然說話 + 禁令
    shootingTypePrompt,    // ~80 字：只送選中的拍攝類型
    includeFrameworks ? FRAMEWORKS_LIST : null,  // ~100 字：框架列表（讓 AI 自選）
    OUTPUT_FORMAT,         // ~400 字：JSON 格式定義
  ]

  return parts.filter(Boolean).join('\n\n')
}

// 匯出各模組供其他地方使用
export { BASE_PROMPT } from './base'
export { SHOOTING_TYPES, DEFAULT_SHOOTING_TYPE } from './shooting-types'
export { FRAMEWORKS, FRAMEWORKS_LIST } from './frameworks'
export { OUTPUT_FORMAT } from './output-format'
