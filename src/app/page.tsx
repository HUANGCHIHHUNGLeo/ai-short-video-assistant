"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Bot, CheckCircle2, FileText, Images, Lightbulb, Play, Sparkles, Video, Zap } from "lucide-react"
import Link from "next/link"
import InstagramReelsCarousel from "@/components/InstagramReelsCarousel"

export default function Home() {
  const quickActions = [
    {
      title: "短影音腳本生成",
      subtitle: "AI 智能寫腳本",
      desc: "輸入主題，AI 自動生成 3~5 個不同風格的專業腳本，包含分鏡、配樂建議",
      icon: Video,
      href: "/script-generator",
      gradient: "from-violet-500 via-purple-500 to-fuchsia-500",
      bgGlow: "bg-purple-500/20",
      tag: "推薦",
    },
    {
      title: "輪播貼文生成",
      subtitle: "IG / 小紅書圖文",
      desc: "一次生成 20 組不同主題的輪播貼文，含完整配文和 hashtag 建議",
      icon: Images,
      href: "/carousel-post",
      gradient: "from-cyan-500 via-blue-500 to-indigo-500",
      bgGlow: "bg-blue-500/20",
      tag: "新功能",
    },
  ]

  const tools = [
    {
      title: "深度定位教練",
      desc: "找不到內容方向？深度分析最適合的定位策略",
      icon: Bot,
      href: "/positioning",
      color: "hover:border-blue-300 hover:bg-blue-50/50 dark:hover:bg-blue-950/30",
    },
    {
      title: "文案優化器",
      desc: "將現有文案進行專業優化，提升吸引力和轉化率",
      icon: FileText,
      href: "/copy-optimizer",
      color: "hover:border-green-300 hover:bg-green-50/50 dark:hover:bg-green-950/30",
    },
    {
      title: "選題靈感庫",
      desc: "根據你的領域，AI 推薦高潛力的爆款選題方向",
      icon: Lightbulb,
      href: "/topic-ideas",
      color: "hover:border-amber-300 hover:bg-amber-50/50 dark:hover:bg-amber-950/30",
    },
  ]

  return (
    <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 p-4 sm:p-8 md:p-12 border">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,transparent,black)] dark:bg-grid-slate-700/25" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full bg-primary/10 text-primary text-xs sm:text-sm font-medium mb-3 sm:mb-6">
            <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
            AI 短影音內容創作平台
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight mb-2 sm:mb-4">
            專業內容，一鍵生成
          </h1>

          <p className="text-muted-foreground text-sm sm:text-base lg:text-lg">
            基於 SFM 流量變現系統，為內容創作者提供專業的 AI 輔助工具。
            從定位分析到腳本生成，全方位提升你的創作效率。
          </p>
        </div>
      </div>

      {/* 推薦影片 */}
      <InstagramReelsCarousel />

      {/* 主要功能 */}
      <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-2">
        {quickActions.map((action) => (
          <Link key={action.title} href={action.href} className="block">
            <Card className="relative h-full cursor-pointer group hover:shadow-lg transition-all duration-300 overflow-hidden border-2 hover:border-primary/30">
              <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full ${action.bgGlow} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

              <CardHeader className="pb-2 sm:pb-4 relative px-3 sm:px-6 pt-3 sm:pt-6">
                <div className="flex items-start justify-between mb-2 sm:mb-4">
                  <div className={`w-9 h-9 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl bg-gradient-to-br ${action.gradient} flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
                    <action.icon className="h-4 w-4 sm:h-7 sm:w-7 text-white" />
                  </div>
                  <Badge variant="secondary" className="font-medium text-[10px] sm:text-xs px-1.5 sm:px-2.5">
                    {action.tag}
                  </Badge>
                </div>

                <CardTitle className="text-sm sm:text-xl group-hover:text-primary transition-colors leading-tight">
                  {action.title}
                </CardTitle>
                <p className="text-[10px] sm:text-sm text-muted-foreground font-medium mt-0.5 sm:mt-1">
                  {action.subtitle}
                </p>
              </CardHeader>

              <CardContent className="relative px-3 sm:px-6 pb-3 sm:pb-6">
                <p className="text-muted-foreground mb-2 sm:mb-6 text-xs sm:text-sm leading-relaxed hidden sm:block">
                  {action.desc}
                </p>
                <Button
                  className={`w-full bg-gradient-to-r ${action.gradient} hover:opacity-90 shadow-sm text-xs sm:text-sm h-8 sm:h-9`}
                  size="sm"
                >
                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                  開始使用
                  <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4 ml-auto" />
                </Button>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* 使用流程 */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg text-center">簡單三步驟，快速生成專業內容</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 md:gap-12 py-2 sm:py-4">
            {[
              { step: 1, title: "填寫背景資料", desc: "描述你的領域與目標受眾" },
              { step: 2, title: "設定內容需求", desc: "說明主題與期望呈現方式" },
              { step: 3, title: "AI 智能生成", desc: "獲得多版本專業內容" },
            ].map((item, index) => (
              <div key={item.step} className="flex items-center gap-3 sm:gap-4">
                <div className="flex flex-col items-center text-center">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold mb-1.5 sm:mb-2 text-sm sm:text-base">
                    {item.step}
                  </div>
                  <p className="font-semibold text-sm sm:text-base">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:mt-1 max-w-[120px] sm:max-w-none">{item.desc}</p>
                </div>
                {index < 2 && (
                  <ArrowRight className="hidden sm:block h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* 其他工具 */}
      <div>
        <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
          <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
          更多工具
        </h2>
        <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3">
          {tools.map((tool) => (
            <Link key={tool.title} href={tool.href}>
              <Card className={`h-full cursor-pointer group transition-all duration-300 ${tool.color}`}>
                <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors flex-shrink-0">
                      <tool.icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm sm:text-base group-hover:text-primary transition-colors">
                        {tool.title}
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                        {tool.desc}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* 功能特色 */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4 sm:py-6 px-4 sm:px-6">
          <div className="grid gap-3 sm:gap-4 grid-cols-2 md:grid-cols-4">
            {[
              { icon: CheckCircle2, text: "台灣在地化口語腳本" },
              { icon: CheckCircle2, text: "多版本內容自由選擇" },
              { icon: CheckCircle2, text: "完整分鏡與配樂建議" },
              { icon: CheckCircle2, text: "一鍵複製立即使用" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-1.5 sm:gap-2">
                <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
