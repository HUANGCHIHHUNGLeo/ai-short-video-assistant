// useUser Hook - 管理用戶認證狀態
'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/lib/supabase/types'

interface UseUserReturn {
  user: User | null
  profile: Profile | null
  isLoading: boolean
  isAuthenticated: boolean
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>
  signUp: (email: string, password: string, displayName?: string) => Promise<{ error: Error | null }>
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>
  signInWithGoogle: () => Promise<{ error: Error | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

export function useUser(): UseUserReturn {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // 使用 useMemo 確保 supabase client 只創建一次
  const supabase = createClient()

  // 取得用戶 profile
  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[useUser] Fetching profile for:', userId)
    console.log('[useUser] Supabase client exists:', !!supabase)

    if (!supabase) {
      console.error('[useUser] Supabase client is null!')
      return null
    }

    try {
      console.log('[useUser] Starting query...')
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      console.log('[useUser] Query completed, data:', data, 'error:', error)

      if (error) {
        console.error('[useUser] Error fetching profile:', error)
        return null
      }
      console.log('[useUser] Profile fetched:', data)
      return data as Profile
    } catch (err) {
      console.error('[useUser] Exception in fetchProfile:', err)
      return null
    }
  }, [supabase])

  // 刷新 profile
  const refreshProfile = useCallback(async () => {
    if (user) {
      const newProfile = await fetchProfile(user.id)
      if (newProfile) {
        setProfile(newProfile)
      }
    }
  }, [user, fetchProfile])

  // 初始化：監聯認證狀態變化
  useEffect(() => {
    let isMounted = true

    // 監聽認證狀態變化（包含初始化）
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useUser] Auth state change:', event, session?.user?.id)

        if (!isMounted) return

        // 處理所有需要更新用戶狀態的事件
        if ((event === 'INITIAL_SESSION' || event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session?.user) {
          console.log('[useUser] Setting user from session:', session.user.id)
          setUser(session.user)

          // 獲取 profile
          const userProfile = await fetchProfile(session.user.id)
          if (isMounted) {
            setProfile(userProfile)
            setIsLoading(false)
          }
        } else if (event === 'SIGNED_OUT') {
          console.log('[useUser] User signed out')
          setUser(null)
          setProfile(null)
          setIsLoading(false)
        } else if (event === 'INITIAL_SESSION' && !session) {
          // 沒有 session 的初始狀態
          console.log('[useUser] No initial session')
          setIsLoading(false)
        }
      }
    )

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [supabase, fetchProfile])

  // 監聽 profile 資料庫變化（用於升級後即時更新 UI）
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel(`profile-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload) => {
          // 當 profile 被更新時（例如升級方案），即時更新前端狀態
          console.log('[useUser] Profile updated:', payload.new)
          setProfile(payload.new as Profile)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, user])

  // 密碼登入
  const signInWithPassword = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error: error as Error | null }
  }

  // 註冊新帳號
  const signUp = async (email: string, password: string, displayName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        },
      },
    })
    return { error: error as Error | null }
  }

  // Email Magic Link 登入
  const signInWithEmail = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  }

  // Google OAuth 登入
  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
    return { error: error as Error | null }
  }

  // 登出
  const signOut = async () => {
    try {
      // 加入 timeout 保護，避免無限等待
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('SignOut timeout')), 5000)
      )

      const signOutPromise = supabase.auth.signOut()

      await Promise.race([signOutPromise, timeoutPromise])
    } catch (err) {
      console.error('[useUser] SignOut error:', err)
    } finally {
      // 無論成功或失敗，都清除本地狀態
      setUser(null)
      setProfile(null)
    }
  }

  return {
    user,
    profile,
    isLoading,
    isAuthenticated: !!user,
    signInWithPassword,
    signUp,
    signInWithEmail,
    signInWithGoogle,
    signOut,
    refreshProfile,
  }
}
