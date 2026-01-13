"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lightbulb, RefreshCw, Sparkles, TrendingUp } from "lucide-react"
import { useState } from "react"

interface TopicIdea {
  title: string
  description: string
  trendScore: number
  category: string
}

export default function TopicIdeasPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [niche, setNiche] = useState("")
  const [ideas, setIdeas] = useState<TopicIdea[]>([
    {
      title: "30歲前必須懂的3個理財觀念",
      description: "針對年輕上班族，講解最容易忽略的理財盲點",
      trendScore: 92,
      category: "理財"
    },
    {
      title: "為什麼你的努力不被看見？",
      description: "職場生存法則，如何讓老闆主動注意到你",
      trendScore: 88,
      category: "職場"
    },
    {
      title: "AI 時代，這3種人會被淘汰",
      description: "結合時事熱點，分析未來職業趨勢",
      trendScore: 95,
      category: "趨勢"
    },
    {
      title: "月薪3萬如何存到第一桶金",
      description: "實用存錢技巧，低薪也能累積財富",
      trendScore: 90,
      category: "理財"
    }
  ])

  const handleRefresh = async () => {
    setIsLoading(true)
    // 模擬 API 請求
    setTimeout(() => {
      setIdeas([
        {
          title: "為什麼越努力越窮？",
          description: "打破窮忙思維，學會用腦袋賺錢",
          trendScore: 94,
          category: "思維"
        },
        {
          title: "我如何在25歲達成財務自由",
          description: "真實案例分享，可複製的成功路徑",
          trendScore: 91,
          category: "故事"
        },
        {
          title: "這個習慣讓我收入翻倍",
          description: "高效人士的秘密武器",
          trendScore: 87,
          category: "效率"
        },
        {
          title: "老闆不會告訴你的職場真相",
          description: "揭露職場潛規則，避開升遷陷阱",
          trendScore: 89,
          category: "職場"
        }
      ])
      setIsLoading(false)
    }, 1500)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Lightbulb className="h-8 w-8 text-primary" />
            熱門選題靈感
          </h1>
          <p className="text-muted-foreground mt-2">
            結合你的定位和全網熱點，推薦最有爆款潛力的選題。
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label>你的領域/定位</Label>
              <Input
                placeholder="例如：個人理財、職場成長、自媒體經營..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="mt-2"
              />
            </div>
            <Button onClick={handleRefresh} disabled={isLoading}>
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              生成選題
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Ideas Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {ideas.map((idea, index) => (
          <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer group">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {idea.category}
                    </span>
                  </div>
                  <CardTitle className="group-hover:text-primary transition-colors">
                    {idea.title}
                  </CardTitle>
                  <CardDescription className="mt-2">
                    {idea.description}
                  </CardDescription>
                </div>
                <div className="flex flex-col items-center ml-4">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  <span className="text-lg font-bold text-green-500">{idea.trendScore}</span>
                  <span className="text-xs text-muted-foreground">熱度</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                使用這個選題生成腳本
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
