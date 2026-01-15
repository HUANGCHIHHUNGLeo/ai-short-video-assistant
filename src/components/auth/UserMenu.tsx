// 用戶選單元件 - 顯示用戶資訊和登出按鈕
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { LogOut, Settings, User, CreditCard } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { SUBSCRIPTION_TIERS } from '@/lib/credits/types'
import Link from 'next/link'

export function UserMenu() {
  const { user, profile, signOut, isLoading } = useUser()
  const [isSigningOut, setIsSigningOut] = useState(false)

  if (isLoading) {
    return (
      <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
    )
  }

  if (!user || !profile) {
    return null
  }

  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
  }

  const tier = profile.subscription_tier || 'free'
  const tierInfo = SUBSCRIPTION_TIERS[tier]
  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : profile.email.slice(0, 2).toUpperCase()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-9 w-9 rounded-full">
          <Avatar className="h-9 w-9">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.display_name || ''} />
            <AvatarFallback className="bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">
              {profile.display_name || '用戶'}
            </p>
            <p className="text-xs leading-none text-muted-foreground">
              {profile.email}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                tier === 'lifetime' ? 'bg-amber-500/20 text-amber-600' :
                tier === 'pro' ? 'bg-purple-500/20 text-purple-600' :
                tier === 'creator' ? 'bg-blue-500/20 text-blue-600' :
                'bg-gray-500/20 text-gray-600'
              }`}>
                {tierInfo.name}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" className="cursor-pointer">
            <User className="mr-2 h-4 w-4" />
            <span>個人資料</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/pricing" className="cursor-pointer">
            <CreditCard className="mr-2 h-4 w-4" />
            <span>訂閱方案</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/settings" className="cursor-pointer">
            <Settings className="mr-2 h-4 w-4" />
            <span>設定</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer text-destructive focus:text-destructive"
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? '登出中...' : '登出'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
