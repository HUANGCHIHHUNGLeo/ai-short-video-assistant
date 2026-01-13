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
    features: [
      '每月 5 次腳本生成',
      '每月 2 次輪播貼文（20則/次）',
      '全功能體驗',
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
    features: [
      '每月 15 次腳本生成',
      '每月 10 次輪播貼文（20則/次）',
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
    features: [
      '每月 100 次腳本生成',
      '每月 50 次輪播貼文（20則/次）',
      '永久歷史記錄',
      'API 存取權限',
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
    features: [
      '無限次腳本生成',
      '無限次輪播貼文',
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
