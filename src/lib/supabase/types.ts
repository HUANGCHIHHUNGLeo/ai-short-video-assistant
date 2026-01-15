// Supabase 資料庫類型定義
// 這個檔案定義了所有資料表的結構

export type SubscriptionTier = 'free' | 'creator' | 'pro' | 'lifetime'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'
export type FeatureType = 'script' | 'carousel' | 'positioning' | 'copy_optimizer' | 'topic_ideas'

export interface Database {
  public: {
    Tables: {
      // 用戶資料表
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          subscription_tier: SubscriptionTier
          subscription_status: SubscriptionStatus
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          current_period_end: string | null
          credits_script: number
          credits_carousel: number
          credits_reset_date: string | null
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          credits_script?: number
          credits_carousel?: number
          credits_reset_date?: string | null
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          subscription_tier?: SubscriptionTier
          subscription_status?: SubscriptionStatus
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          current_period_end?: string | null
          credits_script?: number
          credits_carousel?: number
          credits_reset_date?: string | null
          is_admin?: boolean
          updated_at?: string
        }
      }

      // 生成記錄表
      generations: {
        Row: {
          id: string
          user_id: string
          feature_type: FeatureType
          title: string | null
          input_data: Record<string, unknown>
          output_data: Record<string, unknown>
          model_used: string | null
          tokens_used: number | null
          is_favorite: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature_type: FeatureType
          title?: string | null
          input_data: Record<string, unknown>
          output_data: Record<string, unknown>
          model_used?: string | null
          tokens_used?: number | null
          is_favorite?: boolean
          created_at?: string
        }
        Update: {
          title?: string | null
          is_favorite?: boolean
        }
      }

      // 使用量日誌表
      usage_logs: {
        Row: {
          id: string
          user_id: string
          feature_type: FeatureType
          credits_consumed: number
          generation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          feature_type: FeatureType
          credits_consumed?: number
          generation_id?: string | null
          created_at?: string
        }
        Update: never
      }

      // API 成本追蹤表
      api_cost_logs: {
        Row: {
          id: string
          user_id: string | null
          feature_type: FeatureType
          model_name: string
          input_tokens: number
          output_tokens: number
          total_tokens: number
          cost_usd: number
          cost_twd: number
          generation_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          feature_type: FeatureType
          model_name: string
          input_tokens?: number
          output_tokens?: number
          total_tokens?: number
          cost_usd?: number
          cost_twd?: number
          generation_id?: string | null
          created_at?: string
        }
        Update: never
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      // 消耗額度（原子操作）
      consume_credit: {
        Args: {
          p_user_id: string
          p_feature_type: FeatureType
        }
        Returns: {
          success: boolean
          remaining_credits: number
          message: string
        }
      }
      // 重置每月額度
      reset_monthly_credits: {
        Args: Record<string, never>
        Returns: void
      }
    }
    Enums: {
      subscription_tier: SubscriptionTier
      subscription_status: SubscriptionStatus
      feature_type: FeatureType
    }
  }
}

// 方便使用的類型別名
export type Profile = Database['public']['Tables']['profiles']['Row']
export type ProfileInsert = Database['public']['Tables']['profiles']['Insert']
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update']

export type Generation = Database['public']['Tables']['generations']['Row']
export type GenerationInsert = Database['public']['Tables']['generations']['Insert']
export type GenerationUpdate = Database['public']['Tables']['generations']['Update']

export type UsageLog = Database['public']['Tables']['usage_logs']['Row']
export type UsageLogInsert = Database['public']['Tables']['usage_logs']['Insert']

export type ApiCostLog = Database['public']['Tables']['api_cost_logs']['Row']
export type ApiCostLogInsert = Database['public']['Tables']['api_cost_logs']['Insert']
