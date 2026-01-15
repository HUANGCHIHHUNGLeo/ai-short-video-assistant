import { NextRequest, NextResponse } from "next/server"
import { createClient, createServiceClient } from "@/lib/supabase/server"

// 生成記錄類型
interface Generation {
  id: string
  feature_type: string
  title: string | null
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  is_favorite: boolean
  created_at: string
  model_used: string | null
}

/**
 * GET /api/generations
 * 獲取用戶的所有生成記錄（分頁）
 *
 * Query params:
 * - type: 篩選類型（positioning, script, carousel）
 * - page: 頁碼（從 1 開始）
 * - limit: 每頁數量（預設 10，最大 50）
 * - favorites: 只顯示收藏（true/false）
 */
export async function GET(request: NextRequest) {
  try {
    // 檢查用戶認證
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "請先登入", requireLogin: true },
        { status: 401 }
      )
    }

    // 解析查詢參數
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')))
    const favoritesOnly = searchParams.get('favorites') === 'true'

    const offset = (page - 1) * limit

    // 構建查詢
    const serviceClient = createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (serviceClient as any)
      .from('generations')
      .select('id, feature_type, title, input_data, output_data, is_favorite, created_at, model_used', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    // 篩選類型
    if (type && ['positioning', 'script', 'carousel'].includes(type)) {
      query = query.eq('feature_type', type)
    }

    // 只顯示收藏
    if (favoritesOnly) {
      query = query.eq('is_favorite', true)
    }

    // 分頁
    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query as {
      data: Generation[] | null
      error: Error | null
      count: number | null
    }

    if (error) {
      console.error('Fetch generations error:', error)
      return NextResponse.json(
        { error: "獲取記錄失敗" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      records: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "獲取生成記錄時發生錯誤" },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/generations
 * 更新生成記錄（收藏/取消收藏）
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "請先登入", requireLogin: true },
        { status: 401 }
      )
    }

    const { id, is_favorite } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "缺少記錄 ID" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // 確保只能更新自己的記錄
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (serviceClient as any)
      .from('generations')
      .update({ is_favorite: !!is_favorite })
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Update generation error:', error)
      return NextResponse.json(
        { error: "更新失敗" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "更新記錄時發生錯誤" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/generations
 * 刪除生成記錄
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: "請先登入", requireLogin: true },
        { status: 401 }
      )
    }

    const { id } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: "缺少記錄 ID" },
        { status: 400 }
      )
    }

    const serviceClient = createServiceClient()

    // 確保只能刪除自己的記錄
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (serviceClient as any)
      .from('generations')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Delete generation error:', error)
      return NextResponse.json(
        { error: "刪除失敗" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "刪除記錄時發生錯誤" },
      { status: 500 }
    )
  }
}
