"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lightbulb, RefreshCw, Sparkles, TrendingUp, Target, Zap } from "lucide-react"
import { useState } from "react"

interface TopicIdea {
  title: string
  type: string
  description: string
  targetAudience: string
  hookSuggestion: string
  trendScore: number
}

export default function TopicIdeasPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [niche, setNiche] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [ideas, setIdeas] = useState<TopicIdea[]>([])
  const [hasSearched, setHasSearched] = useState(false)

  const handleGenerate = async () => {
    if (!niche.trim()) return

    setIsLoading(true)
    setHasSearched(true)

    try {
      const response = await fetch("/api/topic-ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, targetAudience })
      })

      const data = await response.json()

      if (data.ideas) {
        setIdeas(data.ideas)
      }
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      "痛點型": "bg-red-500/10 text-red-600",
      "反常識型": "bg-purple-500/10 text-purple-600",
      "數據型": "bg-blue-500/10 text-blue-600",
      "故事型": "bg-orange-500/10 text-orange-600",
      "清單型": "bg-green-500/10 text-green-600",
    }
    return colors[type] || "bg-primary/10 text-primary"
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
            基於 SFM 流量變現系統，AI 幫你找到最有爆款潛力的選題。
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            選題設定
          </CardTitle>
          <CardDescription>
            輸入你的領域定位，AI 會根據你的特點推薦選題
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>你的領域/定位 *</Label>
              <Input
                placeholder="例如：個人理財、職場成長、自媒體經營..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>目標受眾（選填）</Label>
              <Input
                placeholder="例如：25-35歲上班族、創業新手..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
              />
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !niche.trim()}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                AI 正在分析中...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                生成爆款選題
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Ideas Grid */}
      {!hasSearched && (
        <div className="text-center py-12 text-muted-foreground">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
            <Lightbulb className="h-8 w-8 opacity-50" />
          </div>
          <p>輸入你的領域定位，AI 會為你推薦最有爆款潛力的選題</p>
        </div>
      )}

      {hasSearched && !isLoading && ideas.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>沒有找到選題，請嘗試不同的領域描述</p>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {ideas.map((idea, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow group">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(idea.type)}`}>
                        {idea.type}
                      </span>
                      {idea.targetAudience && (
                        <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          {idea.targetAudience}
                        </span>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors text-lg">
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
              <CardContent className="space-y-3">
                {idea.hookSuggestion && (
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                      <Zap className="h-4 w-4" />
                      建議開頭
                    </div>
                    <p className="text-sm text-muted-foreground">{idea.hookSuggestion}</p>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  onClick={() => navigator.clipboard.writeText(idea.title)}
                >
                  複製選題標題
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
