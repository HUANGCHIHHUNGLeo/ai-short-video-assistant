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
  Video
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const navigation = [
    { name: "儀表板", href: "/", icon: LayoutDashboard },
    { name: "AI 定位教練", href: "/positioning", icon: Bot },
    { name: "爆款腳本生成", href: "/script-generator", icon: Video },
    { name: "輪播貼文生成", href: "/carousel-post", icon: Images },
    { name: "文案覆盤優化", href: "/copy-optimizer", icon: FileText },
    { name: "熱門選題靈感", href: "/topic-ideas", icon: Lightbulb },
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

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border/40 bg-[var(--sidebar)] fixed inset-y-0 z-50">
        <div className="h-16 flex items-center px-6 border-b border-border/40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg tracking-tight">顏董 AI 助理</span>
          </div>
        </div>

        <ScrollArea className="flex-1 py-6 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <NavItem key={item.name} item={item} />
            ))}
          </div>

        </ScrollArea>

        <div className="p-4 border-t border-border/40">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-bold shadow-lg">
              U
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">User</p>
              <p className="text-xs text-muted-foreground truncate">Pro Plan</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Header & Content */}
      <div className="flex-1 flex flex-col md:pl-64 transition-all duration-300">
        <header className="h-16 md:hidden flex items-center justify-between px-4 border-b border-border/40 bg-background/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/50">
              <Bot className="h-5 w-5 text-primary" />
            </div>
            <span className="font-bold text-lg">顏董 AI</span>
          </div>

          <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-[var(--sidebar)] border-r border-border/40">
              <div className="h-16 flex items-center px-6 border-b border-border/40">
                <span className="font-bold text-xl">選單</span>
              </div>
              <ScrollArea className="h-[calc(100vh-4rem)] py-6 px-3">
                <div className="space-y-2">
                  {navigation.map((item) => (
                    <NavItem key={item.name} item={item} mobile />
                  ))}
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>
        </header>

        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  )
}
