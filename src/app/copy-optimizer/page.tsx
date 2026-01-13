"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Sparkles, Wand2 } from "lucide-react"
import { useState } from "react"

export default function CopyOptimizerPage() {
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [originalCopy, setOriginalCopy] = useState("")
  const [result, setResult] = useState<{
    score: number
    feedback: string
    optimized: string
  } | null>(null)

  const handleOptimize = async () => {
    if (!originalCopy.trim()) return

    setIsOptimizing(true)
    setResult(null)

    try {
      const response = await fetch("/api/optimize-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ copy: originalCopy })
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsOptimizing(false)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-8 w-8 text-primary" />
          文案覆盤優化
        </h1>
        <p className="text-muted-foreground mt-2">
          貼上你的文案，AI 會從「獲客」和「變現」角度進行診斷和優化。
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Panel */}
        <Card className="flex flex-col h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              原始文案
            </CardTitle>
            <CardDescription>
              貼上你想優化的文案內容
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col gap-4">
            <Textarea
              placeholder="把你的文案貼在這裡...&#10;&#10;可以是影片腳本、貼文文案、廣告文字等。"
              className="flex-1 resize-none min-h-[300px]"
              value={originalCopy}
              onChange={(e) => setOriginalCopy(e.target.value)}
            />
            <Button
              className="w-full h-12 text-lg font-bold"
              onClick={handleOptimize}
              disabled={isOptimizing || !originalCopy.trim()}
            >
              {isOptimizing ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  AI 正在分析中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  開始診斷優化
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="flex flex-col h-full bg-muted/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              診斷結果
            </CardTitle>
            <CardDescription>
              AI 分析與優化建議
            </CardDescription>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0 min-h-0">
            {!result && !isOptimizing && (
              <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <FileText className="h-8 w-8 opacity-50" />
                </div>
                <p>在左側貼上文案並點擊診斷，<br />AI 將為你分析並提供優化版本。</p>
              </div>
            )}

            {isOptimizing && (
              <div className="h-full flex flex-col items-center justify-center p-8">
                <div className="space-y-4 w-full max-w-md">
                  <div className="text-center text-muted-foreground mb-4">
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
              <ScrollArea className="h-full p-6">
                {/* Score */}
                <div className="text-center mb-6">
                  <div className="text-5xl font-bold text-primary">{result.score}</div>
                  <div className="text-sm text-muted-foreground">/ 100 分</div>
                </div>

                {/* Feedback */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-2">診斷分析</h4>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap bg-muted/50 p-4 rounded-lg">
                    {result.feedback}
                  </div>
                </div>

                {/* Optimized Version */}
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" />
                    優化版本
                  </h4>
                  <div className="text-sm whitespace-pre-wrap">
                    {result.optimized}
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
