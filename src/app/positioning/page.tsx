"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, User } from "lucide-react"
import { useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function PositioningPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `你好！我是 AI 定位教練。

我會用 SFM 流量變現系統來幫你找到最適合的自媒體定位。首先，請回答以下幾個問題，讓我了解你的背景：

┌─────────────────────────────────────┐
│ 1. 你目前的職業/專業是什麼？           │
│ 2. 你有什麼特殊技能或興趣？            │
│ 3. 你過去有什麼獨特經歷或成就？        │
│ 4. 你擅長什麼？別人常來問你什麼問題？  │
└─────────────────────────────────────┘

不用一次全部回答，可以先聊聊你最想分享的部分！`
    }
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)

  const { canUseFeature, useCredit, display } = useCredits()

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

    // 檢查額度
    const creditCheck = canUseFeature('positioning')
    if (!creditCheck.canUse) {
      setCreditError(creditCheck.message || '額度不足')
      return
    }

    setCreditError(null)
    const userMessage = input.trim()
    setInput("")
    setMessages(prev => [...prev, { role: "user", content: userMessage }])
    setIsLoading(true)

    try {
      const response = await fetch("/api/positioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, { role: "user", content: userMessage }]
        })
      })

      const data = await response.json()

      if (data.reply) {
        // 成功後扣除額度
        if (data._creditConsumed) {
          useCredit('positioning')
        }
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }])
      }
    } catch (error) {
      console.error("Error:", error)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "抱歉，發生了一些錯誤。請稍後再試。"
      }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="h-[calc(100vh-10rem)] sm:h-[calc(100vh-8rem)] flex flex-col gap-4 sm:gap-6">
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Bot className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            AI 定位教練
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            讓 AI 幫你找到最適合的自媒體定位
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              剩餘 {display.script}
            </span>
          </p>
        </div>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
          <CardTitle className="text-base sm:text-lg">定位諮詢對話</CardTitle>
          <CardDescription className="text-sm">
            告訴我你的背景和目標，我會幫你找到獨特的定位方向
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 gap-3 sm:gap-4 px-4 sm:px-6">
          <ScrollArea className="flex-1 pr-2 sm:pr-4">
            <div className="space-y-3 sm:space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-2 sm:gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    {message.role === "user" ? <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
                  </div>
                  <div className={`rounded-lg p-3 sm:p-4 max-w-[85%] sm:max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <p className="text-xs sm:text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-2 sm:gap-3">
                  <div className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-3 sm:p-4">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.1s" }} />
                      <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: "0.2s" }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* 額度不足提示 */}
          {creditError && (
            <CreditsAlert message={creditError} featureType="script" />
          )}
          <div className="flex gap-2">
            <Input
              placeholder="輸入你的想法..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              disabled={isLoading}
            />
            <Button onClick={handleSend} disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
