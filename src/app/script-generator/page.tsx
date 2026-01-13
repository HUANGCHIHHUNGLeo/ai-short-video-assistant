"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, FileText, Sparkles, Video, Wand2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"

export default function ScriptGeneratorPage() {
  const searchParams = useSearchParams()
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<string | null>(null)
  const [topic, setTopic] = useState("")
  const [audience, setAudience] = useState("")
  const [duration, setDuration] = useState("30-60")
  const [keyMessage, setKeyMessage] = useState("")
  const [openingStyle, setOpeningStyle] = useState("")

  // 從 URL 參數讀取選題
  useEffect(() => {
    const topicParam = searchParams.get("topic")
    if (topicParam) {
      setTopic(topicParam)
    }
  }, [searchParams])

  const handleGenerate = async () => {
    if (!topic) return

    setIsGenerating(true)
    setGeneratedScript(null)

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          audience,
          duration,
          keyMessage,
          openingStyle
        })
      })

      const data = await response.json()

      if (data.script) {
        setGeneratedScript(data.script)
      } else {
        setGeneratedScript("生成失敗，請稍後再試。")
      }
    } catch (error) {
      console.error("Error:", error)
      setGeneratedScript("發生錯誤，請檢查 API Key 設定。")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript)
    }
  }

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            爆款腳本生成器
          </h1>
          <p className="text-muted-foreground mt-2">
            輸入主題，AI 自動套用顏董爆款公式，生成分鏡腳本。
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Input Panel */}
        <Card className="flex flex-col h-full border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              腳本設定
            </CardTitle>
            <CardDescription>
              設定你的影片參數，讓 AI 更精準地為你創作。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 flex-1 overflow-y-auto">
            <div className="space-y-2">
              <Label>影片主題 *</Label>
              <Input
                placeholder="例如：新手如何開始做自媒體？"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>目標受眾</Label>
                <Select value={audience} onValueChange={setAudience}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇受眾" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">職場新鮮人</SelectItem>
                    <SelectItem value="business">中小企業主</SelectItem>
                    <SelectItem value="freelancer">自由接案者</SelectItem>
                    <SelectItem value="student">學生族群</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>影片時長</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger>
                    <SelectValue placeholder="選擇時長" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-30">15-30 秒 (極短)</SelectItem>
                    <SelectItem value="30-60">30-60 秒 (標準)</SelectItem>
                    <SelectItem value="60+">60 秒以上 (長片)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>核心觀點 (Key Message)</Label>
              <Textarea
                placeholder="你想傳達的最重要的一句話是什麼？"
                className="h-24 resize-none"
                value={keyMessage}
                onChange={(e) => setKeyMessage(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>選擇爆款開頭風格（五種必爆開頭）</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {["提問直擊痛點", "反常識觀點", "數據震驚", "故事懸念", "直接利益"].map((style) => (
                  <div
                    key={style}
                    className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-colors ${
                      openingStyle === style
                        ? "border-primary bg-primary/5"
                        : "border-border hover:bg-muted/50"
                    }`}
                    onClick={() => setOpeningStyle(style)}
                  >
                    <div className={`h-4 w-4 rounded-full border-2 ${
                      openingStyle === style
                        ? "border-primary bg-primary"
                        : "border-muted-foreground"
                    }`} />
                    <span className="text-sm">{style}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button
              className="w-full h-12 text-lg font-bold shadow-lg mt-4"
              onClick={handleGenerate}
              disabled={isGenerating || !topic}
            >
              {isGenerating ? (
                <>
                  <Sparkles className="mr-2 h-5 w-5 animate-spin" />
                  AI 正在創作中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-5 w-5" />
                  立即生成爆款腳本
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card className="flex flex-col h-full bg-muted/30">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                生成結果
              </CardTitle>
              <CardDescription>
                AI 生成的分鏡腳本將顯示在這裡
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" disabled={!generatedScript} onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" disabled={!generatedScript}>
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <Separator />
          <CardContent className="flex-1 p-0 min-h-0 relative">
            {!generatedScript && !isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground p-8 text-center">
                <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <Video className="h-8 w-8 opacity-50" />
                </div>
                <p>在左側設定參數並點擊生成，<br />AI 將為你撰寫專業的分鏡腳本。</p>
              </div>
            )}

            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-8">
                <div className="space-y-4 w-full max-w-md">
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>正在構思開頭...</span>
                    <span>生成中</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary animate-pulse" style={{ width: "60%" }} />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 bg-muted/50 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded w-full animate-pulse" />
                    <div className="h-4 bg-muted/50 rounded w-5/6 animate-pulse" />
                  </div>
                </div>
              </div>
            )}

            {generatedScript && !isGenerating && (
              <ScrollArea className="h-full p-6">
                <div className="whitespace-pre-wrap font-mono text-sm leading-relaxed">
                  {generatedScript}
                </div>

                <div className="mt-8 p-4 rounded-lg bg-primary/10 border border-primary/20">
                  <h4 className="font-bold text-primary flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4" />
                    顏董拍攝建議
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                    <li>開頭前 3 秒語速要快，眼神要堅定看著鏡頭。</li>
                    <li>切換場景時，動作要俐落，不要有拖泥帶水的轉場特效。</li>
                    <li>最後的 CTA 一定要加上手勢引導，提高轉化率。</li>
                  </ul>
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
