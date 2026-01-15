// 管理員用戶列表 API
import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { SubscriptionTier, SubscriptionStatus } from '@/lib/supabase/types'

interface UserProfile {
  id: string
  email: string
  display_name: string | null
  subscription_tier: SubscriptionTier
  subscription_status: SubscriptionStatus
  credits_script: number
  credits_carousel: number
  created_at: string
  updated_at: string
}

interface CostStat {
  user_id: string
  cost_usd: number
  cost_twd: number
}

export async function GET(request: NextRequest) {
  try {
    // 用一般 client 驗證用戶身份
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    // 使用 Service Client
    const supabase = createServiceClient()
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const tier = searchParams.get('tier')
    const search = searchParams.get('search')

    // 檢查是否為管理員
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null }

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: '無權限存取' }, { status: 403 })
    }

    // 建立查詢
    let query = supabase
      .from('profiles')
      .select(`
        id,
        email,
        display_name,
        subscription_tier,
        subscription_status,
        credits_script,
        credits_carousel,
        created_at,
        updated_at
      `, { count: 'exact' })

    // 過濾訂閱等級
    if (tier && tier !== 'all') {
      query = query.eq('subscription_tier', tier)
    }

    // 搜尋
    if (search) {
      query = query.or(`email.ilike.%${search}%,display_name.ilike.%${search}%`)
    }

    // 分頁
    const from = (page - 1) * limit
    const to = from + limit - 1

    const { data: users, count, error } = await query
      .order('created_at', { ascending: false })
      .range(from, to)

    if (error) {
      throw error
    }

    const typedUsers = users as UserProfile[] | null

    // 取得每個用戶的使用統計
    const userIds = typedUsers?.map(u => u.id) || []
    const { data: costStats } = await supabase
      .from('api_cost_logs')
      .select('user_id, cost_usd, cost_twd')
      .in('user_id', userIds)

    const typedCostStats = costStats as CostStat[] | null

    // 計算每個用戶的總成本
    const userCosts: Record<string, { usd: number; twd: number }> = {}
    typedCostStats?.forEach(c => {
      if (!userCosts[c.user_id]) {
        userCosts[c.user_id] = { usd: 0, twd: 0 }
      }
      userCosts[c.user_id].usd += Number(c.cost_usd)
      userCosts[c.user_id].twd += Number(c.cost_twd)
    })

    // 合併資料
    const usersWithCosts = typedUsers?.map(u => ({
      ...u,
      totalCostUsd: Math.round((userCosts[u.id]?.usd || 0) * 100) / 100,
      totalCostTwd: Math.round(userCosts[u.id]?.twd || 0),
    }))

    return NextResponse.json({
      users: usersWithCosts,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Admin users error:', error)
    return NextResponse.json(
      { error: '取得用戶列表失敗' },
      { status: 500 }
    )
  }
}

// 更新用戶
export async function PATCH(request: NextRequest) {
  try {
    // 用一般 client 驗證用戶身份
    const authClient = await createClient()
    const { data: { user } } = await authClient.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: '未登入' }, { status: 401 })
    }

    const supabase = createServiceClient()
    const body = await request.json()
    const { userId, updates } = body

    // 檢查是否為管理員
    const { data: adminProfile } = await supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as { data: { is_admin: boolean } | null }

    if (!adminProfile?.is_admin) {
      return NextResponse.json({ error: '無權限存取' }, { status: 403 })
    }

    // 允許更新的欄位
    const allowedFields = [
      'subscription_tier',
      'subscription_status',
      'credits_script',
      'credits_carousel',
      'is_admin',
    ]

    const filteredUpdates: Record<string, unknown> = {}
    for (const key of Object.keys(updates)) {
      if (allowedFields.includes(key)) {
        filteredUpdates[key] = updates[key]
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase
      .from('profiles') as any)
      .update(filteredUpdates)
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ user: data })
  } catch (error) {
    console.error('Admin update user error:', error)
    return NextResponse.json(
      { error: '更新用戶失敗' },
      { status: 500 }
    )
  }
}
