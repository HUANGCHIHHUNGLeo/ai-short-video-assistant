// 管理員統計 API
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SubscriptionTier } from '@/lib/supabase/types'

interface UserStat {
  subscription_tier: SubscriptionTier
  created_at: string
}

interface CostData {
  cost_usd: number
  cost_twd: number
  model_name: string
  created_at: string
}

export async function GET(request: NextRequest) {
  try {
    // 用一般 client 驗證用戶身份
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    // 使用 Service Client 來取得管理員資料（繞過 RLS）
    const supabase = createServiceClient()

    // 檢查是否為管理員
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null }

    if (!profile?.is_admin) {
      return NextResponse.json({ error: '無權限存取' }, { status: 403 })
    }

    // 取得用戶統計
    const { data: userStats } = await supabase
      .from('profiles')
      .select('subscription_tier, created_at')

    const typedUserStats = userStats as UserStat[] | null
    const totalUsers = typedUserStats?.length || 0
    const freeUsers = typedUserStats?.filter(u => u.subscription_tier === 'free').length || 0
    const creatorUsers = typedUserStats?.filter(u => u.subscription_tier === 'creator').length || 0
    const proUsers = typedUserStats?.filter(u => u.subscription_tier === 'pro').length || 0
    const lifetimeUsers = typedUserStats?.filter(u => u.subscription_tier === 'lifetime').length || 0

    // 本月新用戶
    const monthStart = new Date()
    monthStart.setDate(1)
    monthStart.setHours(0, 0, 0, 0)
    const newUsersThisMonth = typedUserStats?.filter(u =>
      new Date(u.created_at) >= monthStart
    ).length || 0

    // 取得成本統計
    const { data: costData } = await supabase
      .from('api_cost_logs')
      .select('cost_usd, cost_twd, model_name, created_at')

    const typedCostData = costData as CostData[] | null
    const totalCostUsd = typedCostData?.reduce((sum: number, c) => sum + Number(c.cost_usd), 0) || 0
    const totalCostTwd = typedCostData?.reduce((sum: number, c) => sum + Number(c.cost_twd), 0) || 0

    // 本月成本
    const costThisMonth = typedCostData?.filter(c =>
      new Date(c.created_at) >= monthStart
    )
    const costThisMonthUsd = costThisMonth?.reduce((sum: number, c) => sum + Number(c.cost_usd), 0) || 0
    const costThisMonthTwd = costThisMonth?.reduce((sum: number, c) => sum + Number(c.cost_twd), 0) || 0

    // 今日成本
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    const costToday = typedCostData?.filter(c =>
      new Date(c.created_at) >= todayStart
    )
    const costTodayUsd = costToday?.reduce((sum: number, c) => sum + Number(c.cost_usd), 0) || 0
    const costTodayTwd = costToday?.reduce((sum: number, c) => sum + Number(c.cost_twd), 0) || 0

    // 模型統計
    const modelStats: Record<string, { calls: number; costUsd: number; costTwd: number }> = {}
    typedCostData?.forEach(c => {
      if (!modelStats[c.model_name]) {
        modelStats[c.model_name] = { calls: 0, costUsd: 0, costTwd: 0 }
      }
      modelStats[c.model_name].calls++
      modelStats[c.model_name].costUsd += Number(c.cost_usd)
      modelStats[c.model_name].costTwd += Number(c.cost_twd)
    })

    // 取得生成統計
    const { count: generationsThisMonth } = await supabase
      .from('generations')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthStart.toISOString())

    // 取得收入統計
    interface PaymentData {
      amount_twd: number
      subscription_tier: SubscriptionTier
      created_at: string
      status: string
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: paymentData } = await (supabase
      .from('payment_logs') as any)
      .select('amount_twd, subscription_tier, created_at, status')
      .eq('status', 'completed')

    const typedPaymentData = paymentData as PaymentData[] | null

    const totalRevenueTwd = typedPaymentData?.reduce((sum: number, p) => sum + Number(p.amount_twd), 0) || 0

    const revenueThisMonth = typedPaymentData?.filter(p =>
      new Date(p.created_at) >= monthStart
    )
    const revenueThisMonthTwd = revenueThisMonth?.reduce((sum: number, p) => sum + Number(p.amount_twd), 0) || 0

    const revenueToday = typedPaymentData?.filter(p =>
      new Date(p.created_at) >= todayStart
    )
    const revenueTodayTwd = revenueToday?.reduce((sum: number, p) => sum + Number(p.amount_twd), 0) || 0

    // 各方案收入
    const revenueByTier: Record<string, number> = {}
    typedPaymentData?.forEach(p => {
      const tier = p.subscription_tier || 'unknown'
      if (!revenueByTier[tier]) revenueByTier[tier] = 0
      revenueByTier[tier] += Number(p.amount_twd)
    })

    // 計算利潤
    const totalProfitTwd = totalRevenueTwd - totalCostTwd
    const profitThisMonthTwd = revenueThisMonthTwd - costThisMonthTwd
    const profitTodayTwd = revenueTodayTwd - costTodayTwd

    return NextResponse.json({
      users: {
        total: totalUsers,
        byTier: {
          free: freeUsers,
          creator: creatorUsers,
          pro: proUsers,
          lifetime: lifetimeUsers,
        },
        newThisMonth: newUsersThisMonth,
      },
      costs: {
        total: {
          usd: Math.round(totalCostUsd * 100) / 100,
          twd: Math.round(totalCostTwd),
        },
        thisMonth: {
          usd: Math.round(costThisMonthUsd * 100) / 100,
          twd: Math.round(costThisMonthTwd),
        },
        today: {
          usd: Math.round(costTodayUsd * 100) / 100,
          twd: Math.round(costTodayTwd),
        },
      },
      revenue: {
        total: Math.round(totalRevenueTwd),
        thisMonth: Math.round(revenueThisMonthTwd),
        today: Math.round(revenueTodayTwd),
        byTier: {
          creator: Math.round(revenueByTier['creator'] || 0),
          pro: Math.round(revenueByTier['pro'] || 0),
          lifetime: Math.round(revenueByTier['lifetime'] || 0),
        },
        totalPayments: typedPaymentData?.length || 0,
      },
      profit: {
        total: Math.round(totalProfitTwd),
        thisMonth: Math.round(profitThisMonthTwd),
        today: Math.round(profitTodayTwd),
      },
      models: Object.entries(modelStats).map(([name, stats]) => ({
        name,
        calls: stats.calls,
        costUsd: Math.round(stats.costUsd * 100) / 100,
        costTwd: Math.round(stats.costTwd),
      })).sort((a, b) => b.costUsd - a.costUsd),
      generations: {
        thisMonth: generationsThisMonth || 0,
      },
    })
  } catch (error) {
    console.error('Admin stats error:', error)
    return NextResponse.json(
      { error: '取得統計資料失敗' },
      { status: 500 }
    )
  }
}
