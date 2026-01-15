"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Lightbulb, RefreshCw, Sparkles, TrendingUp, Target, Zap, ArrowRight } from "lucide-react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"

interface TopicIdea {
  title: string
  type: string
  description: string
  targetAudience: string
  hookSuggestion: string
  trendScore: number
}

export default function TopicIdeasPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [niche, setNiche] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [ideas, setIdeas] = useState<TopicIdea[]>([])
  const [hasSearched, setHasSearched] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)

  const { canUseFeature, useCredit, display } = useCredits()

  // 使用選題生成腳本
  const handleUseForScript = (idea: TopicIdea) => {
    // 將選題資訊存到 sessionStorage，讓腳本頁面可以讀取
    sessionStorage.setItem('topic_idea', JSON.stringify({
      title: idea.title,
      type: idea.type,
      description: idea.description,
      hookSuggestion: idea.hookSuggestion,
      niche: niche,
      targetAudience: targetAudience || idea.targetAudience,
    }))
    // 導航到腳本生成頁面
    router.push('/script-generator?from=topic')
  }

  const handleGenerate = async () => {
    if (!niche.trim()) return

    // 檢查額度
    const creditCheck = canUseFeature('topic_ideas')
    if (!creditCheck.canUse) {
      setCreditError(creditCheck.message || '額度不足')
      return
    }

    setCreditError(null)
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
        // 成功後扣除額度
        if (data._creditConsumed) {
          useCredit('topic_ideas')
        }
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
    <div className="flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Lightbulb className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            熱門選題靈感
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            AI 幫你找到最有爆款潛力的選題
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              剩餘 {display.script}
            </span>
          </p>
        </div>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
            選題設定
          </CardTitle>
          <CardDescription className="text-sm">
            輸入你的領域定位，AI 會根據你的特點推薦選題
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 px-4 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-sm">你的領域/定位 *</Label>
              <Input
                placeholder="例如：個人理財、職場成長..."
                value={niche}
                onChange={(e) => setNiche(e.target.value)}
                className="h-10 sm:h-11"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm">目標受眾（選填）</Label>
              <Input
                placeholder="例如：25-35歲上班族..."
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="h-10 sm:h-11"
              />
            </div>
          </div>
          {/* 額度不足提示 */}
          {creditError && (
            <CreditsAlert message={creditError} featureType="script" />
          )}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !niche.trim()}
            className="w-full"
            size="lg"
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
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mb-4 mx-auto">
            <Lightbulb className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
          </div>
          <p className="text-sm sm:text-base">輸入你的領域定位，AI 會為你推薦最有爆款潛力的選題</p>
        </div>
      )}

      {hasSearched && !isLoading && ideas.length === 0 && (
        <div className="text-center py-8 sm:py-12 text-muted-foreground">
          <p className="text-sm sm:text-base">沒有找到選題，請嘗試不同的領域描述</p>
        </div>
      )}

      {ideas.length > 0 && (
        <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2">
          {ideas.map((idea, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow group">
              <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-2">
                      <span className={`text-xs px-2 py-0.5 sm:py-1 rounded-full ${getTypeColor(idea.type)}`}>
                        {idea.type}
                      </span>
                      {idea.targetAudience && (
                        <span className="text-xs px-2 py-0.5 sm:py-1 rounded-full bg-muted text-muted-foreground truncate max-w-[120px]">
                          {idea.targetAudience}
                        </span>
                      )}
                    </div>
                    <CardTitle className="group-hover:text-primary transition-colors text-base sm:text-lg leading-tight">
                      {idea.title}
                    </CardTitle>
                    <CardDescription className="mt-1.5 sm:mt-2 text-xs sm:text-sm line-clamp-2">
                      {idea.description}
                    </CardDescription>
                  </div>
                  <div className="flex flex-col items-center flex-shrink-0">
                    <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-green-500" />
                    <span className="text-base sm:text-lg font-bold text-green-500">{idea.trendScore}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">熱度</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 sm:space-y-3 px-4 sm:px-6">
                {idea.hookSuggestion && (
                  <div className="p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/10">
                    <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-primary mb-1">
                      <Zap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      開頭引導
                    </div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{idea.hookSuggestion}</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-sm"
                    onClick={() => navigator.clipboard.writeText(idea.title)}
                  >
                    複製方向
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 gap-1 text-sm"
                    onClick={() => handleUseForScript(idea)}
                  >
                    生成腳本
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
