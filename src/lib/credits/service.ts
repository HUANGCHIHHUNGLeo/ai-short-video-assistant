import {
  SubscriptionTier,
  FeatureType,
  UserCredits,
  CreditCheckResult,
  PLANS,
  FEATURE_CREDIT_MAP
} from './types'

// 本地儲存 key
const CREDITS_STORAGE_KEY = 'ai_assistant_credits'
const TIER_STORAGE_KEY = 'ai_assistant_tier'

// 獲取當前月份的重置日期（每月1號重置）
function getResetDate(): string {
  const now = new Date()
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  return nextMonth.toISOString().split('T')[0]
}

// 檢查是否需要重置額度
function shouldResetCredits(resetDate: string): boolean {
  const now = new Date()
  const reset = new Date(resetDate)
  return now >= reset
}

// 從本地儲存讀取用戶額度
export function getUserCredits(): UserCredits {
  if (typeof window === 'undefined') {
    // Server-side: 回傳預設值
    return getDefaultCredits('free')
  }

  try {
    const stored = localStorage.getItem(CREDITS_STORAGE_KEY)
    const tier = (localStorage.getItem(TIER_STORAGE_KEY) as SubscriptionTier) || 'free'

    if (stored) {
      const credits: UserCredits = JSON.parse(stored)

      // 檢查是否需要重置
      if (shouldResetCredits(credits.resetDate)) {
        const newCredits = getDefaultCredits(tier)
        saveUserCredits(newCredits)
        return newCredits
      }

      // 確保 tier 同步
      if (credits.tier !== tier) {
        credits.tier = tier
        const plan = PLANS[tier]
        credits.scriptLimit = plan.limits.script
        credits.carouselLimit = plan.limits.carousel
        saveUserCredits(credits)
      }

      return credits
    }

    const defaultCredits = getDefaultCredits(tier)
    saveUserCredits(defaultCredits)
    return defaultCredits
  } catch {
    return getDefaultCredits('free')
  }
}

// 獲取預設額度
function getDefaultCredits(tier: SubscriptionTier): UserCredits {
  const plan = PLANS[tier]
  return {
    tier,
    scriptUsed: 0,
    scriptLimit: plan.limits.script,
    carouselUsed: 0,
    carouselLimit: plan.limits.carousel,
    resetDate: getResetDate(),
  }
}

// 儲存用戶額度
export function saveUserCredits(credits: UserCredits): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(CREDITS_STORAGE_KEY, JSON.stringify(credits))
    localStorage.setItem(TIER_STORAGE_KEY, credits.tier)
  } catch (e) {
    console.error('Failed to save credits:', e)
  }
}

// 檢查是否可以使用某功能
export function checkCredits(feature: FeatureType): CreditCheckResult {
  const credits = getUserCredits()
  const creditType = FEATURE_CREDIT_MAP[feature]

  const used = creditType === 'script' ? credits.scriptUsed : credits.carouselUsed
  const limit = creditType === 'script' ? credits.scriptLimit : credits.carouselLimit

  // -1 表示無限
  if (limit === -1) {
    return {
      canUse: true,
      remaining: -1,
      limit: -1,
      used,
    }
  }

  const remaining = limit - used
  const canUse = remaining > 0

  return {
    canUse,
    remaining,
    limit,
    used,
    message: canUse ? undefined : `本月${creditType === 'script' ? '腳本' : '輪播'}額度已用完，請升級方案`,
  }
}

// 消耗額度
export function consumeCredit(feature: FeatureType): boolean {
  const credits = getUserCredits()
  const creditType = FEATURE_CREDIT_MAP[feature]

  // 檢查是否有足夠額度
  const check = checkCredits(feature)
  if (!check.canUse && check.limit !== -1) {
    return false
  }

  // 無限額度不需要扣除
  if (check.limit === -1) {
    return true
  }

  // 扣除額度
  if (creditType === 'script') {
    credits.scriptUsed += 1
  } else {
    credits.carouselUsed += 1
  }

  saveUserCredits(credits)
  return true
}

// 升級方案
export function upgradeTier(newTier: SubscriptionTier): void {
  if (typeof window === 'undefined') return

  const credits = getUserCredits()
  const plan = PLANS[newTier]

  credits.tier = newTier
  credits.scriptLimit = plan.limits.script
  credits.carouselLimit = plan.limits.carousel

  // 升級時重置已用額度
  credits.scriptUsed = 0
  credits.carouselUsed = 0
  credits.resetDate = getResetDate()

  saveUserCredits(credits)
}

// 格式化剩餘額度顯示
export function formatCreditsDisplay(credits: UserCredits): {
  script: string
  carousel: string
} {
  const formatSingle = (used: number, limit: number): string => {
    if (limit === -1) return '無限'
    return `${limit - used}/${limit}`
  }

  return {
    script: formatSingle(credits.scriptUsed, credits.scriptLimit),
    carousel: formatSingle(credits.carouselUsed, credits.carouselLimit),
  }
}
