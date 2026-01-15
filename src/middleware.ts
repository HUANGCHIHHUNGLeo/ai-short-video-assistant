// Next.js Middleware - 處理 Supabase Auth Session 刷新
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // 刷新 session（如果需要的話）
  // 這會自動處理 token refresh
  await supabase.auth.getUser()

  return supabaseResponse
}

// 只對需要的路徑執行 middleware
export const config = {
  matcher: [
    /*
     * 匹配所有路徑除了：
     * - _next/static (靜態檔案)
     * - _next/image (圖片優化)
     * - favicon.ico (favicon)
     * - 公開資源
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
