"use client"

import { useState, useEffect, useCallback } from 'react'
import {
  UserCredits,
  FeatureType,
  CreditCheckResult,
  getUserCredits,
  checkCredits,
  consumeCredit,
  formatCreditsDisplay,
  upgradeTier,
  SubscriptionTier,
} from '@/lib/credits'

export function useCredits() {
  const [credits, setCredits] = useState<UserCredits | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 載入額度
  const loadCredits = useCallback(() => {
    const userCredits = getUserCredits()
    setCredits(userCredits)
    setIsLoading(false)
  }, [])

  // 初始化
  useEffect(() => {
    loadCredits()
  }, [loadCredits])

  // 檢查某功能是否可用
  const canUseFeature = useCallback((feature: FeatureType): CreditCheckResult => {
    return checkCredits(feature)
  }, [])

  // 使用額度
  const useCredit = useCallback((feature: FeatureType): boolean => {
    const success = consumeCredit(feature)
    if (success) {
      loadCredits() // 重新載入以更新狀態
    }
    return success
  }, [loadCredits])

  // 升級方案
  const upgrade = useCallback((tier: SubscriptionTier) => {
    upgradeTier(tier)
    loadCredits()
  }, [loadCredits])

  // 格式化顯示
  const display = credits ? formatCreditsDisplay(credits) : { script: '載入中...', carousel: '載入中...' }

  return {
    credits,
    isLoading,
    display,
    canUseFeature,
    useCredit,
    upgrade,
    refresh: loadCredits,
  }
}
