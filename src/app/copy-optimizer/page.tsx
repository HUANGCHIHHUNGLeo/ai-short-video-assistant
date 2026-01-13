"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Sparkles, Wand2 } from "lucide-react"
import { useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"

export default function CopyOptimizerPage() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [originalCopy, setOriginalCopy] = useState("")
  const [creditError, setCreditError] = useState<string | null>(null)
  const [result, setResult] = useState<{
    score: number
    breakdown?: {
      opening: number
      value: number
      painPoint: number
      cta: number
    }
    feedback: string
    optimized: string
  } | null>(null)

  const { canUseFeature, useCredit, display } = useCredits()

  const handleOptimize = async () => {
    if (!originalCopy.trim()) return

    // 檢查額度
    const creditCheck = canUseFeature('copy_optimizer')
    if (!creditCheck.canUse) {
      setCreditError(creditCheck.message || '額度不足')
      return
    }

    setCreditError(null)
    setIsOptimizing(true)
    setResult(null)

    try {
      const response = await fetch("/api/optimize-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy: originalCopy })
      })

      const data = await response.json()
      // 成功後扣除額度
      if (data._creditConsumed) {
        useCredit('copy_optimizer')
      }
      setResult(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6 min-h-[calc(100vh-10rem)] sm:min-h-[calc(100vh-8rem)]">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center shadow-md flex-shrink-0">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            文案覆盤優化
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            AI 從「獲客」和「變現」角度進行診斷
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              剩餘 {display.script}
            </span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-0">
        {/* Input Panel */}
        <Card className="flex flex-col">
          <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Wand2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              原始文案
            </CardTitle>
            <CardDescription className="text-sm">
              貼上你想優化的文案內容
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-3 sm:gap-4 px-4 sm:px-6">
            <Textarea
              placeholder="把你的文案貼在這裡...&#10;&#10;可以是影片腳本、貼文文案、廣告文字等。"
              className="flex-1 resize-none min-h-[200px] sm:min-h-[300px] text-sm sm:text-base"
              value={originalCopy}
              onChange={(e) => setOriginalCopy(e.target.value)}
            />
            {/* 額度不足提示 */}
            {creditError && (
              <CreditsAlert message={creditError} featureType="script" />
            )}
            <Button
              className="w-full"
              size="lg"
              onClick={handleOptimize}
              disabled={isOptimizing || !originalCopy.trim()}
            >
              {isOptimizing ? (
                <>
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                  AI 正在分析中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                  開始診斷優化
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="flex flex-col bg-muted/30">
          <CardHeader className="px-4 sm:px-6 pb-3 sm:pb-4">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              診斷結果
            </CardTitle>
            <CardDescription className="text-sm">
              AI 分析與優化建議
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0 min-h-0">
            {!result && !isOptimizing && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-6 sm:p-8 text-center min-h-[200px]">
                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-full bg-muted flex items-center justify-center mb-3 sm:mb-4">
                  <FileText className="h-6 w-6 sm:h-8 sm:w-8 opacity-50" />
                </div>
                <p className="text-sm sm:text-base">貼上文案並點擊診斷，<br />AI 將為你分析並提供優化版本</p>
              </div>
            )}

            {isOptimizing && (
              <div className="h-full flex flex-col items-center justify-center p-6 sm:p-8 min-h-[200px]">
                <div className="space-y-4 w-full max-w-md">
                  <div className="text-center text-muted-foreground text-sm sm:text-base mb-4">
                    正在分析文案結構...
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {result && !isOptimizing && (
              <ScrollArea className="h-full max-h-[400px] sm:max-h-[500px]">
                <div className="p-4 sm:p-6">
                  {/* Score */}
                  <div className="text-center mb-4 sm:mb-6">
                    <div className="text-4xl sm:text-5xl font-bold text-primary">{result.score}</div>
                    <div className="text-xs sm:text-sm text-muted-foreground">/ 100 分</div>
                  </div>

                  {/* Breakdown Scores */}
                  {result.breakdown && (
                    <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-4 sm:mb-6">
                      <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-blue-500">{result.breakdown.opening}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">開頭吸引力</div>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-green-500">{result.breakdown.value}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">價值清晰度</div>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-orange-500">{result.breakdown.painPoint}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">痛點觸及度</div>
                      </div>
                      <div className="p-2 sm:p-3 rounded-lg bg-muted/50 text-center">
                        <div className="text-xl sm:text-2xl font-bold text-purple-500">{result.breakdown.cta}</div>
                        <div className="text-[10px] sm:text-xs text-muted-foreground">CTA 強度</div>
                      </div>
                    </div>
                  )}

                  {/* Feedback */}
                  <div className="mb-4 sm:mb-6">
                    <h4 className="font-semibold mb-2 text-sm sm:text-base">診斷分析</h4>
                    <div className="text-xs sm:text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-3 sm:p-4 rounded-lg">
                      {result.feedback}
                    </div>
                  </div>

                  {/* Optimized Version */}
                  <div className="p-3 sm:p-4 rounded-lg bg-primary/10 border border-primary/20">
                    <h4 className="font-bold text-primary flex items-center gap-2 mb-2 text-sm sm:text-base">
                      <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      優化版本
                    </h4>
                    <div className="text-xs sm:text-sm whitespace-pre-wrap">
                      {result.optimized}
                    </div>
                  </div>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
