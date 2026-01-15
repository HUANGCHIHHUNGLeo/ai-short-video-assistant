import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { createServiceClient } from "@/lib/supabase/server"

// 定位記錄類型
interface PositioningGeneration {
  id: string
  title: string | null
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  is_favorite: boolean
  created_at: string
}

/**
 * GET /api/positioning/history
 * 獲取用戶的定位分析歷史記錄
 */
export async function GET() {
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

    // 獲取用戶的定位記錄
    const serviceClient = createServiceClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (serviceClient as any)
      .from('generations')
      .select('id, title, input_data, output_data, is_favorite, created_at')
      .eq('user_id', user.id)
      .eq('feature_type', 'positioning')
      .order('created_at', { ascending: false })
      .limit(20) as { data: PositioningGeneration[] | null; error: Error | null }

    if (error) {
      console.error('Fetch positioning history error:', error)
      return NextResponse.json(
        { error: "獲取記錄失敗" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      records: data || [],
      total: data?.length || 0
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json(
      { error: "獲取定位記錄時發生錯誤" },
      { status: 500 }
    )
  }
}
