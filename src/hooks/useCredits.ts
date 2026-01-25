'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PLANS, SubscriptionTier, FeatureType, FEATURE_CREDIT_MAP } from '@/lib/credits'

interface UserCredits {
  tier: SubscriptionTier
  scriptUsed: number
  scriptLimit: number
  carouselUsed: number
  carouselLimit: number
}

export function useCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const supabase = createClient()

  // 載入額度
  const loadCredits = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setCredits(null)
      setIsLoading(false)
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('subscription_tier, script_credits_used, carousel_credits_used')
      .eq('id', user.id)
      .single()

    if (profile) {
      const tier = (profile.subscription_tier || 'free') as SubscriptionTier
      const plan = PLANS[tier]
      setCredits({
        tier,
        scriptUsed: profile.script_credits_used ?? 0,
        scriptLimit: plan.limits.script,
        carouselUsed: profile.carousel_credits_used ?? 0,
        carouselLimit: plan.limits.carousel,
      })
    }
    setIsLoading(false)
  }, [supabase])

  // 初始化 + 監聽
  useEffect(() => {
    loadCredits()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      loadCredits()
    })

    return () => subscription.unsubscribe()
  }, [loadCredits])

  // 檢查功能是否可用
  const canUseFeature = (feature: FeatureType) => {
    if (!credits) return { canUse: false, remaining: 0, limit: 0, used: 0 }

    const creditType = FEATURE_CREDIT_MAP[feature]
    const used = creditType === 'script' ? credits.scriptUsed : credits.carouselUsed
    const limit = creditType === 'script' ? credits.scriptLimit : credits.carouselLimit

    if (limit === -1) return { canUse: true, remaining: -1, limit: -1, used }

    return {
      canUse: used < limit,
      remaining: limit - used,
      limit,
      used,
    }
  }

  // 使用額度（本地樂觀更新）
  const useCredit = (feature: FeatureType) => {
    if (!credits) return
    const creditType = FEATURE_CREDIT_MAP[feature]
    setCredits(prev => {
      if (!prev) return prev
      return {
        ...prev,
        scriptUsed: creditType === 'script' ? prev.scriptUsed + 1 : prev.scriptUsed,
        carouselUsed: creditType === 'carousel' ? prev.carouselUsed + 1 : prev.carouselUsed,
      }
    })
  }

  // 升級
  const upgrade = async (tier: SubscriptionTier) => {
    const res = await fetch('/api/upgrade', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tier }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || '升級失敗')
    }

    await loadCredits()
  }

  return {
    credits,
    isLoading,
    isAuthenticated: !!credits,
    canUseFeature,
    useCredit,
    upgrade,
    refresh: loadCredits,
    display: credits ? {
      script: credits.scriptLimit === -1 ? '無限' : `${credits.scriptLimit - credits.scriptUsed}/${credits.scriptLimit}`,
      carousel: credits.carouselLimit === -1 ? '無限' : `${credits.carouselLimit - credits.carouselUsed}/${credits.carouselLimit}`,
    } : { script: '-', carousel: '-' },
  }
}
