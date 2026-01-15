// Auth Callback Route - 處理 OAuth 和 Magic Link 回調
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cookie 有效期：30 天（秒）
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                // 確保 cookie 有 30 天的有效期
                const enhancedOptions = {
                  ...options,
                  maxAge: options?.maxAge || COOKIE_MAX_AGE,
                  sameSite: 'lax' as const,
                  secure: process.env.NODE_ENV === 'production',
                }
                cookieStore.set(name, value, enhancedOptions)
              })
            } catch {
              // 忽略錯誤
            }
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // 如果沒有 code 或有錯誤，重定向到首頁
  return NextResponse.redirect(`${origin}/?error=auth_callback_error`)
}
