// Supabase 瀏覽器端 Client
// 用於前端元件中的資料操作

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: 在模組載入時顯示環境變數狀態
if (typeof window !== 'undefined') {
  console.log('[Supabase Client] Module loaded')
  console.log('[Supabase Client] URL exists:', !!supabaseUrl)
  console.log('[Supabase Client] Key exists:', !!supabaseAnonKey)
}

// 單例模式：確保整個應用只有一個 Supabase client 實例
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // 已有 client，直接返回
  if (supabaseClient) {
    return supabaseClient
  }

  // 環境變數未設定
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('[Supabase Client] Environment variables not set!')
    console.warn('[Supabase Client] URL:', supabaseUrl)
    console.warn('[Supabase Client] Key:', supabaseAnonKey ? '[SET]' : '[NOT SET]')
    return null as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  console.log('[Supabase Client] Creating new client...')

  supabaseClient = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )

  console.log('[Supabase Client] Client created successfully')

  return supabaseClient
}
