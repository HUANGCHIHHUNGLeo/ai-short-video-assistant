import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Bot, FileText, Lightbulb, TrendingUp, Video } from "lucide-react"
import Link from "next/link"

export default function Home() {
  const stats = [
    { label: "已生成腳本", value: "12", change: "+2 本週" },
    { label: "已優化文案", value: "8", change: "+3 本週" },
    { label: "靈感收藏", value: "24", change: "+5 本週" },
    { label: "AI 諮詢次數", value: "5", change: "+1 本週" },
  ]

  const features = [
    {
      title: "AI 定位教練",
      desc: "基於 SFM 系統，三個核心問題幫你找到市場需求與個人優勢的交集點。",
      icon: Bot,
      href: "/positioning",
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "爆款腳本生成",
      desc: "五種必爆開頭公式 + 黃金三段結構，AI 幫你寫出高轉化腳本。",
      icon: Video,
      href: "/script-generator",
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "文案覆盤優化",
      desc: "從開頭吸引力、價值清晰度、痛點觸及、CTA 強度四維度診斷優化。",
      icon: FileText,
      href: "/copy-optimizer",
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "熱門選題靈感",
      desc: "根據你的定位，AI 推薦痛點型、反常識型、數據型等五種爆款選題。",
      icon: Lightbulb,
      href: "/topic-ideas",
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ]

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">哎呀，準備好打造爆款了嗎？</h1>
        <p className="text-muted-foreground mt-2">
          基於 SFM 流量變現系統，顏董 AI 助理幫你從定位到腳本，一站式搞定自媒體內容。
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {stat.label}
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">
                {stat.change}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">快速開始</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Link key={feature.title} href={feature.href}>
              <Card className="h-full cursor-pointer group hover:border-primary/50 hover:shadow-lg transition-all duration-300">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg ${feature.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className={`h-6 w-6 ${feature.color}`} />
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
                <CardContent className="mt-auto pt-0">
                  <Button variant="ghost" className="w-full justify-between group-hover:bg-primary/10 group-hover:text-primary">
                    立即使用
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Activity Placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>最近活動</CardTitle>
          <CardDescription>你最近生成的腳本和優化記錄</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>尚無活動記錄，快去生成你的第一個爆款腳本吧！</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
