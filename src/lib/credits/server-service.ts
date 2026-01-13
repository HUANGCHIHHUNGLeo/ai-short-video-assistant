// Server-side credits service
// 從 cookies 讀取用戶額度狀態

import { cookies } from 'next/headers'
import {
  SubscriptionTier,
  FeatureType,
  UserCredits,
  CreditCheckResult,
  PLANS,
  FEATURE_CREDIT_MAP
} from './types'

const CREDITS_COOKIE_KEY = 'ai_assistant_credits'

// 獲取當前月份的重置日期
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

// 獲取預設額度
function getDefaultCredits(tier: SubscriptionTier = 'free'): UserCredits {
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

// 從 cookies 讀取用戶額度（Server-side）
export async function getServerCredits(): Promise<UserCredits> {
  try {
    const cookieStore = await cookies()
    const creditsCookie = cookieStore.get(CREDITS_COOKIE_KEY)

    if (creditsCookie?.value) {
      const credits: UserCredits = JSON.parse(creditsCookie.value)

      // 檢查是否需要重置
      if (shouldResetCredits(credits.resetDate)) {
        return getDefaultCredits(credits.tier)
      }

      return credits
    }

    return getDefaultCredits()
  } catch {
    return getDefaultCredits()
  }
}

// 檢查是否可以使用某功能（Server-side）
export async function checkServerCredits(feature: FeatureType): Promise<CreditCheckResult> {
  const credits = await getServerCredits()
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

// 生成更新後的 credits 物件（用於回傳給前端更新）
export function getUpdatedCredits(credits: UserCredits, feature: FeatureType): UserCredits {
  const creditType = FEATURE_CREDIT_MAP[feature]
  const newCredits = { ...credits }

  if (creditType === 'script') {
    newCredits.scriptUsed += 1
  } else {
    newCredits.carouselUsed += 1
  }

  return newCredits
}
