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
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('[useUser] Error fetching profile:', error)
      return null
    }
    console.log('[useUser] Profile fetched:', data)
    return data as Profile
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
    const initAuth = async () => {
      console.log('[useUser] Initializing auth...')

      // 使用 getUser() 而不是 getSession()，確保 token 是有效的
      const { data: { user: currentUser }, error } = await supabase.auth.getUser()

      console.log('[useUser] getUser result:', { user: currentUser?.id, error: error?.message })

      if (currentUser) {
        setUser(currentUser)
        const userProfile = await fetchProfile(currentUser.id)
        setProfile(userProfile)
      }

      setIsLoading(false)
      console.log('[useUser] Init complete, isAuthenticated:', !!currentUser)
    }

    initAuth()

    // 監聽認證狀態變化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          setUser(session.user)
          const userProfile = await fetchProfile(session.user.id)
          setProfile(userProfile)
        } else if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
        }
      }
    )

    return () => {
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
    await supabase.auth.signOut()
    setUser(null)
    setProfile(null)
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
