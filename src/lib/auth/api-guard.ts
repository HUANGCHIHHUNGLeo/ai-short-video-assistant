// API 認證與額度檢查工具
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { FeatureType } from '@/lib/credits/types'

// 訪客每日免費試用次數
const GUEST_DAILY_LIMIT = 2

// 檢查結果類型
interface AuthCheckResult {
  allowed: boolean
  userId: string | null
  isGuest: boolean
  error?: string
  statusCode?: number
  remainingCredits?: number
}

/**
 * 檢查 API 請求是否允許執行
 * - 已登入用戶：檢查額度
 * - 訪客：檢查每日免費次數（透過 IP）
 */
export async function checkApiAuth(
  request: NextRequest,
  featureType: FeatureType
): Promise<AuthCheckResult> {
  try {
    // 取得用戶認證狀態
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      // 已登入用戶：檢查額度
      return await checkUserCredits(user.id, featureType)
    } else {
      // 訪客：檢查每日限制
      return await checkGuestLimit(request, featureType)
    }
  } catch (error) {
    console.error('Auth check error:', error)
    return {
      allowed: false,
      userId: null,
      isGuest: true,
      error: '認證檢查失敗',
      statusCode: 500
    }
  }
}

// Profile 查詢結果類型
interface ProfileCredits {
  subscription_tier: string | null
  script_credits_used: number
  carousel_credits_used: number
  credits_reset_date: string | null
}

/**
 * 檢查已登入用戶的額度
 */
async function checkUserCredits(
  userId: string,
  featureType: FeatureType
): Promise<AuthCheckResult> {
  const serviceClient = createServiceClient()

  // 取得用戶 profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (serviceClient as any)
    .from('profiles')
    .select('subscription_tier, script_credits_used, carousel_credits_used, credits_reset_date')
    .eq('id', userId)
    .single() as { data: ProfileCredits | null }

  if (!profile) {
    return {
      allowed: false,
      userId,
      isGuest: false,
      error: '找不到用戶資料',
      statusCode: 404
    }
  }

  // 檢查是否需要重置額度（每月 1 號）
  const now = new Date()
  const resetDate = profile.credits_reset_date ? new Date(profile.credits_reset_date) : null
  const shouldReset = !resetDate || resetDate.getMonth() !== now.getMonth()

  if (shouldReset) {
    // 重置額度
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient as any)
      .from('profiles')
      .update({
        script_credits_used: 0,
        carousel_credits_used: 0,
        credits_reset_date: now.toISOString()
      })
      .eq('id', userId)

    // 更新本地變數
    profile.script_credits_used = 0
    profile.carousel_credits_used = 0
  }

  // 根據訂閱等級取得額度上限
  const tierLimits: Record<string, { script: number; carousel: number }> = {
    free: { script: 5, carousel: 2 },
    creator: { script: 30, carousel: 10 },
    pro: { script: -1, carousel: -1 }, // -1 = 無限
    lifetime: { script: -1, carousel: -1 }
  }

  const tier = profile.subscription_tier || 'free'
  const limits = tierLimits[tier] || tierLimits.free

  // 檢查額度
  const creditType = featureType === 'carousel' ? 'carousel' : 'script'
  const used = creditType === 'script' ? profile.script_credits_used : profile.carousel_credits_used
  const limit = creditType === 'script' ? limits.script : limits.carousel

  // 無限額度
  if (limit === -1) {
    return {
      allowed: true,
      userId,
      isGuest: false,
      remainingCredits: -1
    }
  }

  // 檢查是否超過額度
  if (used >= limit) {
    return {
      allowed: false,
      userId,
      isGuest: false,
      error: '本月額度已用完，請升級方案或下月再試',
      statusCode: 403,
      remainingCredits: 0
    }
  }

  return {
    allowed: true,
    userId,
    isGuest: false,
    remainingCredits: limit - used
  }
}

/**
 * 檢查訪客的每日限制（使用 IP）
 */
async function checkGuestLimit(
  request: NextRequest,
  featureType: FeatureType
): Promise<AuthCheckResult> {
  // 取得訪客 IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
             request.headers.get('x-real-ip') ||
             'unknown'

  const serviceClient = createServiceClient()

  // 查詢今日該 IP 的使用次數
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // 使用 usage_logs 表記錄訪客使用
  const { count } = await serviceClient
    .from('usage_logs')
    .select('*', { count: 'exact', head: true })
    .is('user_id', null)
    .eq('guest_ip', ip)
    .gte('created_at', today.toISOString())

  const usedToday = count || 0

  if (usedToday >= GUEST_DAILY_LIMIT) {
    return {
      allowed: false,
      userId: null,
      isGuest: true,
      error: '免費試用次數已達上限，請登入使用更多功能',
      statusCode: 403,
      remainingCredits: 0
    }
  }

  return {
    allowed: true,
    userId: null,
    isGuest: true,
    remainingCredits: GUEST_DAILY_LIMIT - usedToday
  }
}

/**
 * 記錄使用量（成功後呼叫）
 */
export async function recordUsage(
  request: NextRequest,
  userId: string | null,
  featureType: FeatureType
): Promise<void> {
  try {
    const serviceClient = createServiceClient()

    if (userId) {
      // 已登入用戶：更新 profile 的額度使用量
      const creditColumn = featureType === 'carousel' ? 'carousel_credits_used' : 'script_credits_used'

      // 使用 RPC 或直接更新
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (serviceClient as any)
        .from('profiles')
        .select(creditColumn)
        .eq('id', userId)
        .single() as { data: Record<string, number> | null }

      if (profile) {
        const currentUsed = profile[creditColumn] || 0
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (serviceClient as any)
          .from('profiles')
          .update({ [creditColumn]: currentUsed + 1 })
          .eq('id', userId)
      }

      // 同時記錄到 usage_logs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any).from('usage_logs').insert({
        user_id: userId,
        feature_type: featureType,
        credits_consumed: 1
      })
    } else {
      // 訪客：記錄 IP
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
                 request.headers.get('x-real-ip') ||
                 'unknown'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (serviceClient as any).from('usage_logs').insert({
        user_id: null,
        feature_type: featureType,
        credits_consumed: 1,
        guest_ip: ip
      })
    }
  } catch (error) {
    console.error('Record usage error:', error)
    // 不拋出錯誤，避免影響主流程
  }
}

/**
 * 快速回傳錯誤
 */
export function authError(result: AuthCheckResult): NextResponse {
  return NextResponse.json(
    {
      error: result.error,
      requireLogin: result.isGuest,
      remainingCredits: result.remainingCredits
    },
    { status: result.statusCode || 403 }
  )
}
