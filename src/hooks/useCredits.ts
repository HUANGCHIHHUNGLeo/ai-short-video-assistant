"use client"

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  UserCredits,
  FeatureType,
  CreditCheckResult,
  PLANS,
  FEATURE_CREDIT_MAP,
  SubscriptionTier,
} from '@/lib/credits'

// 訪客預設額度
const GUEST_CREDITS: UserCredits = {
  tier: 'free',
  scriptUsed: 0,
  scriptLimit: 2, // 訪客每日 2 次
  carouselUsed: 0,
  carouselLimit: 2,
  resetDate: new Date().toISOString(),
}

export function useCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  const supabase = createClient()

  // 從 Supabase 載入用戶額度
  const loadCredits = useCallback(async () => {
    console.log('[useCredits] loadCredits called, supabase exists:', !!supabase)

    if (!supabase) {
      console.error('[useCredits] Supabase client is null!')
      setCredits(GUEST_CREDITS)
      setIsLoading(false)
      return
    }

    try {
      // 先檢查是否已登入
      const { data: { user } } = await supabase.auth.getUser()
      console.log('[useCredits] getUser result:', user?.id)

      if (!user) {
        // 未登入：顯示訪客狀態
        setIsAuthenticated(false)
        setCredits(GUEST_CREDITS)
        setIsLoading(false)
        return
      }

      setIsAuthenticated(true)

      // 已登入：從資料庫讀取實際額度
      console.log('[useCredits] Starting profile query for user:', user.id)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single() as {
          data: {
            subscription_tier?: string
            script_credits_used?: number
            carousel_credits_used?: number
            credits_reset_date?: string
          } | null
          error: unknown
        }

      console.log('[useCredits] Profile query result:', { profile, error: profileError })

      if (profileError) {
        console.error('[useCredits] Error fetching profile:', profileError)
        // 即使查詢失敗，也設置認證狀態為已登入，使用預設額度
        const defaultCredits: UserCredits = {
          tier: 'free',
          scriptUsed: 0,
          scriptLimit: PLANS.free.limits.script,
          carouselUsed: 0,
          carouselLimit: PLANS.free.limits.carousel,
          resetDate: new Date().toISOString(),
        }
        setCredits(defaultCredits)
        return
      }

      if (profile) {
        // 支援兩種欄位命名方式
        const tier = (profile.subscription_tier || 'free') as SubscriptionTier
        const plan = PLANS[tier]

        // 嘗試讀取使用量（支援不同的欄位名稱）
        const scriptUsed = profile.script_credits_used ?? 0
        const carouselUsed = profile.carousel_credits_used ?? 0

        const userCredits: UserCredits = {
          tier,
          scriptUsed,
          scriptLimit: plan.limits.script,
          carouselUsed,
          carouselLimit: plan.limits.carousel,
          resetDate: profile.credits_reset_date || new Date().toISOString(),
        }

        console.log('[useCredits] Setting credits:', userCredits)
        setCredits(userCredits)

        // 同步到 localStorage（供離線參考）
        if (typeof window !== 'undefined') {
          localStorage.setItem('ai_assistant_credits', JSON.stringify(userCredits))
          localStorage.setItem('ai_assistant_tier', tier)
        }
      } else {
        // 找不到 profile，使用免費版預設
        console.log('[useCredits] No profile found, using default')
        const defaultCredits: UserCredits = {
          tier: 'free',
          scriptUsed: 0,
          scriptLimit: PLANS.free.limits.script,
          carouselUsed: 0,
          carouselLimit: PLANS.free.limits.carousel,
          resetDate: new Date().toISOString(),
        }
        setCredits(defaultCredits)
      }
    } catch (error) {
      console.error('Error loading credits:', error)
      setCredits(GUEST_CREDITS)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  // 初始化 + 監聽認證狀態變化
  useEffect(() => {
    // 監聽登入/登出事件（包含 INITIAL_SESSION）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event) => {
        console.log('[useCredits] Auth state change:', event)
        // INITIAL_SESSION 是頁面重新整理時的初始事件
        if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
          await loadCredits()
        }
      }
    )

    // 立即載入一次（以防 INITIAL_SESSION 已經錯過）
    loadCredits()

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, loadCredits])

  // 監聽 profile 資料庫變化（升級後即時更新額度顯示）
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null

    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      channel = supabase
        .channel(`credits-${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          () => {
            // 當 profile 被更新時（例如升級方案），重新載入額度
            console.log('[useCredits] Profile updated, reloading credits')
            loadCredits()
          }
        )
        .subscribe()
    }

    setupRealtimeSubscription()

    return () => {
      if (channel) {
        supabase.removeChannel(channel)
      }
    }
  }, [supabase, loadCredits])

  // 檢查某功能是否可用
  const canUseFeature = useCallback((feature: FeatureType): CreditCheckResult => {
    if (!credits) {
      return {
        canUse: false,
        remaining: 0,
        limit: 0,
        used: 0,
        message: '載入中...',
      }
    }

    // 未登入訪客
    if (!isAuthenticated) {
      return {
        canUse: true, // 讓 API 端決定是否允許
        remaining: 2,
        limit: 2,
        used: 0,
        message: '訪客模式',
      }
    }

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
  }, [credits, isAuthenticated])

  // 使用額度（本地更新，實際扣除由 API 處理）
  const useCredit = useCallback((feature: FeatureType): boolean => {
    if (!credits || !isAuthenticated) return true // 訪客讓 API 處理

    const check = canUseFeature(feature)
    if (!check.canUse && check.limit !== -1) {
      return false
    }

    // 無限額度不需要本地扣除
    if (check.limit === -1) {
      return true
    }

    // 本地更新（樂觀更新）
    const creditType = FEATURE_CREDIT_MAP[feature]
    setCredits(prev => {
      if (!prev) return prev
      return {
        ...prev,
        scriptUsed: creditType === 'script' ? prev.scriptUsed + 1 : prev.scriptUsed,
        carouselUsed: creditType === 'carousel' ? prev.carouselUsed + 1 : prev.carouselUsed,
      }
    })

    return true
  }, [credits, isAuthenticated, canUseFeature])

  // 升級方案（測試版本直接呼叫 API 升級，正式版改接 Stripe）
  const upgrade = useCallback(async (tier?: SubscriptionTier) => {
    if (!tier) {
      await loadCredits()
      return
    }

    try {
      const response = await fetch('/api/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || '升級失敗')
      }

      // Realtime 會自動更新，但也手動 reload 確保同步
      await loadCredits()
    } catch (error) {
      console.error('Upgrade error:', error)
      throw error
    }
  }, [loadCredits])

  // 格式化顯示
  const formatDisplay = (used: number, limit: number): string => {
    if (limit === -1) return '無限'
    return `${Math.max(0, limit - used)}/${limit}`
  }

  const display = credits
    ? {
        script: formatDisplay(credits.scriptUsed, credits.scriptLimit),
        carousel: formatDisplay(credits.carouselUsed, credits.carouselLimit),
      }
    : { script: '載入中...', carousel: '載入中...' }

  return {
    credits,
    isLoading,
    isAuthenticated,
    display,
    canUseFeature,
    useCredit,
    upgrade,
    refresh: loadCredits,
  }
}
