"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import {
  Bot,
  FileText,
  Images,
  LayoutDashboard,
  Lightbulb,
  Menu,
  Video,
  CreditCard,
  LogIn,
  LogOut,
  Shield,
  History
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { CreditsBadge } from "@/components/billing"
import { useCredits } from "@/hooks/useCredits"
import { useUser } from "@/hooks/useUser"
import { PLANS } from "@/lib/credits"
import { AuthModal, UserMenu } from "@/components/auth"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const { credits } = useCredits()
  const { user, profile, isLoading: isUserLoading, isAuthenticated, signOut } = useUser()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const currentPlan = credits ? PLANS[credits.tier] : PLANS.free

  const navigation = [
    { name: "儀表板", href: "/", icon: LayoutDashboard },
    { name: "深度定位教練", href: "/positioning", icon: Bot },
    { name: "爆款腳本生成", href: "/script-generator", icon: Video },
    { name: "輪播貼文生成", href: "/carousel-post", icon: Images },
    { name: "文案覆盤優化", href: "/copy-optimizer", icon: FileText },
    { name: "熱門選題靈感", href: "/topic-ideas", icon: Lightbulb },
    { name: "生成記錄", href: "/history", icon: History },
    { name: "升級方案", href: "/pricing", icon: CreditCard },
    // 管理員專用
    ...(profile?.is_admin ? [{ name: "管理後台", href: "/admin", icon: Shield }] : []),
  ]

  const NavItem = ({ item, mobile = false }: { item: typeof navigation[0], mobile?: boolean }) => {
    const isActive = pathname === item.href
    return (
      <Link href={item.href}>
        <Button
          variant={isActive ? "secondary" : "ghost"}
          className={cn(
            "w-full justify-start gap-3 mb-1 font-medium transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary hover:bg-primary/20 border-r-2 border-primary rounded-r-none"
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
            mobile ? "h-12 text-lg" : "h-10"
          )}
          onClick={() => mobile && setIsMobileOpen(false)}
        >
          <item.icon className={cn("h-5 w-5", isActive ? "text-primary" : "text-muted-foreground")} />
          {item.name}
        </Button>
      </Link>
    )
  }

  // 用戶資訊區塊
  const UserSection = ({ mobile = false }: { mobile?: boolean }) => {
    // Debug: 檢查認證狀態
    console.log('[UserSection]', { isUserLoading, isAuthenticated, hasProfile: !!profile })

    // 載入中顯示骨架屏
    if (isUserLoading) {
      return (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-4 w-20 bg-muted animate-pulse rounded" />
            <div className="h-3 w-16 bg-muted animate-pulse rounded mt-1" />
          </div>
        </div>
      )
    }

    // 已登入 - 優先從 user (session) 取得資訊，不依賴 profile 查詢
    if (isAuthenticated && user) {
      // 優先順序：profile > user.user_metadata > user.email
      const displayName = profile?.display_name
        || user.user_metadata?.full_name
        || user.user_metadata?.name
        || user.email?.split('@')[0]
        || '用戶'
      const avatarUrl = profile?.avatar_url || user.user_metadata?.avatar_url
      const initials = displayName.slice(0, 2).toUpperCase()

      const handleSignOut = async () => {
        setIsSigningOut(true)
        try {
          await signOut()
        } catch (err) {
          console.error('[DashboardLayout] SignOut error:', err)
        } finally {
          setIsSigningOut(false)
          // 強制刷新頁面確保狀態清除
          window.location.reload()
        }
      }

      return (
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarImage src={avatarUrl || undefined} />
              <AvatarFallback className={cn(
                "text-white font-bold",
                credits?.tier === 'lifetime' ? "bg-gradient-to-br from-amber-500 to-orange-500" :
                credits?.tier === 'pro' ? "bg-gradient-to-br from-purple-500 to-pink-500" :
                credits?.tier === 'creator' ? "bg-gradient-to-br from-blue-500 to-cyan-500" :
                "bg-gradient-to-br from-gray-500 to-gray-600"
              )}>
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {displayName}
              </p>
              <div className={cn(
                "text-xs px-2 py-0.5 rounded-full w-fit",
                credits?.tier === 'lifetime' ? "bg-amber-500/20 text-amber-600" :
                credits?.tier === 'pro' ? "bg-purple-500/20 text-purple-600" :
                credits?.tier === 'creator' ? "bg-blue-500/20 text-blue-600" :
                "bg-gray-500/20 text-gray-600"
              )}>
                {currentPlan.name}
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
            onClick={handleSignOut}
            disabled={isSigningOut}
          >
            <LogOut className="h-4 w-4" />
            {isSigningOut ? '登出中...' : '登出'}
          </Button>
        </div>
      )
    }

    // 未登入狀態
    return (
      <Button
        variant="outline"
        className="w-full justify-start gap-2"
        onClick={() => {
          if (mobile) setIsMobileOpen(false)
          setShowAuthModal(true)
        }}
      >
        <LogIn className="h-4 w-4" />
        登入 / 註冊
      </Button>
    )
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Auth Modal */}
      <AuthModal open={showAuthModal} onOpenChange={setShowAuthModal} />

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-[var(--sidebar)] fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">短影音助理</span>
          </div>
        </div>

        <ScrollArea className="flex-1 py-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>

        </ScrollArea>

        {/* 額度顯示區 */}
        <div className="p-4 border-t border-border/40">
          <div className="mb-3">
            <CreditsBadge showDetails className="w-full justify-center" />
          </div>
          <UserSection />
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <header className="h-16 md:hidden flex items-center px-4 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="flex-shrink-0 -ml-2">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-[var(--sidebar)] border-r border-border/40 flex flex-col">
              <div className="h-16 flex items-center px-6 border-b border-border/40">
                <span className="font-bold text-xl">選單</span>
              </div>
              <ScrollArea className="flex-1 py-6 px-3">
                <div className="space-y-2">
                  {navigation.map((item) => (
                    <NavItem key={item.name} item={item} mobile />
                  ))}
                </div>
              </ScrollArea>
              {/* 手機版底部方案顯示 */}
              <div className="p-4 border-t border-border/40">
                <UserSection mobile />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 ml-2 flex-1">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">短影音助理</span>
          </div>
          {/* 手機版右側：額度 + 用戶選單 */}
          <div className="flex items-center gap-2 ml-auto">
            <CreditsBadge />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowAuthModal(true)}
              >
                <LogIn className="h-5 w-5" />
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
