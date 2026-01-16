// Supabase 瀏覽器端 Client
// 用於前端元件中的資料操作

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// 單例模式：確保整個應用只有一個 Supabase client 實例
let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  if (supabaseClient) {
    return supabaseClient
  }

  if (!supabaseUrl || !supabaseAnonKey) {
    // 在 build 時或環境變數未設定時，返回一個 mock client
    // 實際運行時會有正確的環境變數
    console.warn('Supabase environment variables not set')
    return null as unknown as ReturnType<typeof createBrowserClient<Database>>
  }

  supabaseClient = createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  )

  return supabaseClient
}
