"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Textarea } from "@/components/ui/textarea"
import { Bot, Send, User } from "lucide-react"
import { useState } from "react"

interface Message {
  role: "user" | "assistant"
  content: string
}

export default function PositioningPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: `哎呀，你好！我是顏董 AI 定位教練。

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

  const handleSend = async () => {
    if (!input.trim() || isLoading) return

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
    <div className="h-[calc(100vh-8rem)] flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Bot className="h-8 w-8 text-primary" />
          AI 定位教練
        </h1>
        <p className="text-muted-foreground mt-2">
          迷茫時的第一步，讓 AI 幫你找到最適合的自媒體定位。
        </p>
      </div>

      <Card className="flex-1 flex flex-col min-h-0">
        <CardHeader className="pb-4">
          <CardTitle>定位諮詢對話</CardTitle>
          <CardDescription>
            告訴我你的背景和目標，我會幫你找到獨特的定位方向。
          </CardDescription>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col min-h-0 gap-4">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    {message.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div className={`rounded-lg p-4 max-w-[80%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  }`}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="bg-muted rounded-lg p-4">
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
