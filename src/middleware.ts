// Next.js Middleware - 處理 Supabase Auth Session 刷新
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Cookie 有效期：30 天（秒）
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export async function middleware(request: NextRequest) {
  // 如果環境變數未設定，直接跳過 middleware
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
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
          cookiesToSet.forEach(({ name, value, options }) => {
            // 確保 cookie 有足夠長的有效期（30天）
            const enhancedOptions = {
              ...options,
              maxAge: options?.maxAge || COOKIE_MAX_AGE,
              sameSite: 'lax' as const,
              secure: process.env.NODE_ENV === 'production',
            }
            supabaseResponse.cookies.set(name, value, enhancedOptions)
          })
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
