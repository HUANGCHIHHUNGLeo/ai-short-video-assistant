// 測試用升級 API - 正式上線前移除或改接 Stripe
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const VALID_TIERS = ['free', 'creator', 'pro', 'lifetime'] as const
type SubscriptionTier = typeof VALID_TIERS[number]

export async function POST(request: NextRequest) {
  try {
    // 驗證用戶已登入
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '請先登入' },
        { status: 401 }
      )
    }

    // 取得要升級的方案
    const { tier } = await request.json()

    if (!tier || !VALID_TIERS.includes(tier)) {
      return NextResponse.json(
        { error: '無效的方案' },
        { status: 400 }
      )
    }

    // 使用 service client 更新資料庫
    const serviceClient = createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (serviceClient as any)
      .from('profiles')
      .update({
        subscription_tier: tier,
        // 升級時重置額度使用量
        script_credits_used: 0,
        carousel_credits_used: 0,
        credits_reset_date: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (updateError) {
      console.error('Upgrade error:', updateError)
      return NextResponse.json(
        { error: '升級失敗，請稍後再試' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      tier,
      message: `已升級到 ${tier} 方案`,
    })
  } catch (error) {
    console.error('Upgrade API error:', error)
    return NextResponse.json(
      { error: '升級失敗' },
      { status: 500 }
    )
  }
}
