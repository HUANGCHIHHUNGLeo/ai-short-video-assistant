// 訂閱方案類型
export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'lifetime'

// 功能類型
export type FeatureType = 'script' | 'carousel' | 'positioning' | 'copy_optimizer' | 'topic_ideas'

// 方案配置
export interface PlanConfig {
  name: string
  nameEn: string
  monthlyPrice: number
  yearlyPrice?: number
  lifetimePrice?: number
  limits: {
    script: number      // 腳本生成次數
    carousel: number    // 輪播貼文次數（每次20則）
  }
  historyRetentionDays: number  // 歷史記錄保留天數（-1 表示永久）
  features: string[]
}

// 用戶額度狀態
export interface UserCredits {
  tier: SubscriptionTier
  scriptUsed: number
  scriptLimit: number
  carouselUsed: number
  carouselLimit: number
  resetDate: string
}

// 額度檢查結果
export interface CreditCheckResult {
  canUse: boolean
  remaining: number
  limit: number
  used: number
  message?: string
}

// 各方案配置
export const PLANS: Record<SubscriptionTier, PlanConfig> = {
  free: {
    name: '免費版',
    nameEn: 'Free',
    monthlyPrice: 0,
    limits: {
      script: 5,
      carousel: 2,
    },
    historyRetentionDays: 0,  // 無歷史記錄
    features: [
      '每月 5 次腳本生成',
      '每次生成 2 個腳本版本',
      '每月 2 次輪播貼文（20則/次）',
      '基礎定位分析報告',
      '無歷史記錄',
    ],
  },
  creator: {
    name: '創作者版',
    nameEn: 'Creator',
    monthlyPrice: 299,
    yearlyPrice: 2490,
    limits: {
      script: 15,
      carousel: 10,
    },
    historyRetentionDays: 30,  // 30 天後自動刪除
    features: [
      '每月 15 次腳本生成',
      '每次生成最多 3 個腳本版本',
      '每月 10 次輪播貼文（20則/次）',
      '基礎定位分析報告',
      '30 天歷史記錄',
      '優先客服支援',
    ],
  },
  pro: {
    name: '專業版',
    nameEn: 'Pro',
    monthlyPrice: 699,
    yearlyPrice: 5990,
    limits: {
      script: 100,
      carousel: 50,
    },
    historyRetentionDays: 180,  // 180 天後自動刪除
    features: [
      '每月 100 次腳本生成',
      '每次生成最多 5 個腳本版本',
      '每月 50 次輪播貼文（20則/次）',
      '完整定位分析（含 SWOT、變現路徑）',
      'KPI 目標與第一週任務規劃',
      '個人品牌建議與潛在機會分析',
      '專業分鏡表視圖',
      '180 天歷史記錄',
      '優先新功能體驗',
    ],
  },
  lifetime: {
    name: '買斷版',
    nameEn: 'Lifetime',
    monthlyPrice: 0,
    lifetimePrice: 19800,
    limits: {
      script: -1,   // -1 表示無限
      carousel: -1,
    },
    historyRetentionDays: -1,  // -1 表示永久保留
    features: [
      '無限次腳本生成',
      '每次生成最多 5 個腳本版本',
      '無限次輪播貼文',
      '完整定位分析（含 SWOT、變現路徑）',
      'KPI 目標與第一週任務規劃',
      '個人品牌建議與潛在機會分析',
      '專業分鏡表視圖',
      '永久歷史記錄',
      '不定時更新維護',
      '終身使用權',
    ],
  },
}

// 功能對應的額度類型
export const FEATURE_CREDIT_MAP: Record<FeatureType, 'script' | 'carousel'> = {
  script: 'script',
  carousel: 'carousel',
  positioning: 'script',      // 定位教練算腳本類
  copy_optimizer: 'script',   // 文案優化算腳本類
  topic_ideas: 'script',      // 選題靈感算腳本類
}

// 訂閱等級資訊（供 UI 使用）
export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, { name: string; color: string }> = {
  free: { name: '免費版', color: 'gray' },
  creator: { name: '創作者版', color: 'blue' },
  pro: { name: '專業版', color: 'purple' },
  lifetime: { name: '買斷版', color: 'amber' },
}
