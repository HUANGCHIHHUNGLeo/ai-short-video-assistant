"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { Copy, Download, FileText, Sparkles, Video, Wand2, User, Target, MessageSquare } from "lucide-react"
import { useState } from "react"

export default function ScriptGeneratorPage() {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedScript, setGeneratedScript] = useState<string | null>(null)

  // Step 1: 了解創作者背景
  const [creatorBackground, setCreatorBackground] = useState({
    niche: "",
    expertise: "",
    targetAudience: "",
    audiencePainPoints: "",
    contentStyle: ""
  })

  // Step 2: 影片設定
  const [videoSettings, setVideoSettings] = useState({
    topic: "",
    goal: "",
    duration: "30-60",
    keyMessage: "",
    cta: ""
  })

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedScript(null)

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorBackground,
          videoSettings
        })
      })

      const data = await response.json()

      if (data.script) {
        setGeneratedScript(data.script)
        setStep(3)
      } else {
        setGeneratedScript("生成失敗，請稍後再試。")
      }
    } catch (error) {
      console.error("Error:", error)
      setGeneratedScript("發生錯誤，請檢查網路連線。")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = () => {
    if (generatedScript) {
      navigator.clipboard.writeText(generatedScript)
    }
  }

  const canProceedStep1 = creatorBackground.niche && creatorBackground.targetAudience
  const canProceedStep2 = videoSettings.topic && videoSettings.goal

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-8 w-8 text-primary" />
          爆款腳本生成器
        </h1>
        <p className="text-muted-foreground mt-2">
          填寫完整資訊，AI 根據你的定位和目標生成最適合的腳本。
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {[
          { num: 1, label: "創作者背景", icon: User },
          { num: 2, label: "影片設定", icon: Target },
          { num: 3, label: "生成結果", icon: FileText }
        ].map((s, i) => (
          <div key={s.num} className="flex items-center">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors ${
                step === s.num
                  ? "bg-primary text-primary-foreground"
                  : step > s.num
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              <s.icon className="h-4 w-4" />
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            {i < 2 && <div className="w-8 h-0.5 bg-border mx-2" />}
          </div>
        ))}
      </div>

      {/* Step 1: 創作者背景 */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              第一步：告訴我你的創作者背景
            </CardTitle>
            <CardDescription>
              讓 AI 了解你是誰、你的專業和目標受眾，才能生成最適合你的腳本風格。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>你的領域/定位 *</Label>
                <Input
                  placeholder="例如：個人理財教學、職場成長、健身教練..."
                  value={creatorBackground.niche}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, niche: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">你專注在哪個領域做內容？</p>
              </div>

              <div className="space-y-2">
                <Label>你的專業背景/優勢</Label>
                <Input
                  placeholder="例如：10年金融業經驗、考過CFP證照..."
                  value={creatorBackground.expertise}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, expertise: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">什麼讓你有資格談這個話題？</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label>你的目標受眾是誰？ *</Label>
              <Textarea
                placeholder="例如：25-35歲的上班族，月薪 3-5 萬，想學習理財但不知道從何開始，對投資有興趣但怕賠錢..."
                className="h-24 resize-none"
                value={creatorBackground.targetAudience}
                onChange={(e) => setCreatorBackground({ ...creatorBackground, targetAudience: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">描述越具體，腳本越精準（年齡、職業、困擾、渴望）</p>
            </div>

            <div className="space-y-2">
              <Label>他們最大的痛點/困擾是什麼？</Label>
              <Textarea
                placeholder="例如：存不到錢、不知道怎麼開始投資、怕被割韭菜、資訊太多不知道該信誰..."
                className="h-24 resize-none"
                value={creatorBackground.audiencePainPoints}
                onChange={(e) => setCreatorBackground({ ...creatorBackground, audiencePainPoints: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>你的說話風格</Label>
              <Select
                value={creatorBackground.contentStyle}
                onValueChange={(v) => setCreatorBackground({ ...creatorBackground, contentStyle: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇你偏好的風格" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">專業權威型 - 像老師一樣教學</SelectItem>
                  <SelectItem value="friendly">親切朋友型 - 像朋友分享經驗</SelectItem>
                  <SelectItem value="energetic">熱血激勵型 - 充滿能量和感染力</SelectItem>
                  <SelectItem value="humorous">幽默風趣型 - 輕鬆有趣好消化</SelectItem>
                  <SelectItem value="storytelling">故事敘事型 - 用故事帶出觀點</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceedStep1}
                className="px-8"
              >
                下一步：設定影片內容
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 影片設定 */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              第二步：這支影片要達成什麼目標？
            </CardTitle>
            <CardDescription>
              告訴 AI 這支影片的主題和目的，生成最有效的腳本結構。
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>影片主題 *</Label>
              <Input
                placeholder="例如：新手如何開始投資？/ 3個存錢技巧讓你月存1萬"
                value={videoSettings.topic}
                onChange={(e) => setVideoSettings({ ...videoSettings, topic: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">這支影片要講什麼？</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label>影片目標 *</Label>
                <Select
                  value={videoSettings.goal}
                  onValueChange={(v) => setVideoSettings({ ...videoSettings, goal: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="這支影片的主要目的" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="awareness">曝光獲客 - 讓更多人認識我</SelectItem>
                    <SelectItem value="engagement">互動漲粉 - 增加留言分享</SelectItem>
                    <SelectItem value="trust">建立信任 - 展現專業度</SelectItem>
                    <SelectItem value="conversion">導流變現 - 引導私訊/購買</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>影片時長</Label>
                <Select
                  value={videoSettings.duration}
                  onValueChange={(v) => setVideoSettings({ ...videoSettings, duration: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="選擇時長" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15-30">15-30 秒（極短，適合曝光）</SelectItem>
                    <SelectItem value="30-60">30-60 秒（標準，最常見）</SelectItem>
                    <SelectItem value="60-90">60-90 秒（中長，適合教學）</SelectItem>
                    <SelectItem value="90+">90 秒以上（長片，深度內容）</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>核心訊息 (Key Message)</Label>
              <Textarea
                placeholder="看完這支影片，觀眾最應該記住的一句話是什麼？"
                className="h-20 resize-none"
                value={videoSettings.keyMessage}
                onChange={(e) => setVideoSettings({ ...videoSettings, keyMessage: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>希望觀眾做什麼？(CTA)</Label>
              <Select
                value={videoSettings.cta}
                onValueChange={(v) => setVideoSettings({ ...videoSettings, cta: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="選擇行動呼籲類型" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="follow">追蹤帳號</SelectItem>
                  <SelectItem value="like">按讚收藏</SelectItem>
                  <SelectItem value="comment">留言互動</SelectItem>
                  <SelectItem value="share">分享給朋友</SelectItem>
                  <SelectItem value="dm">私訊諮詢</SelectItem>
                  <SelectItem value="link">點擊連結</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep(1)}>
                上一步
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={!canProceedStep2 || isGenerating}
                className="px-8"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="mr-2 h-4 w-4 animate-spin" />
                    AI 正在為你量身打造腳本...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    生成專屬腳本
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 生成結果 */}
      {step === 3 && generatedScript && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 左側：用戶輸入摘要 */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-lg">腳本設定摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="font-medium text-muted-foreground">創作者定位</p>
                <p>{creatorBackground.niche}</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-muted-foreground">目標受眾</p>
                <p>{creatorBackground.targetAudience}</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-muted-foreground">影片主題</p>
                <p>{videoSettings.topic}</p>
              </div>
              <Separator />
              <div>
                <p className="font-medium text-muted-foreground">影片目標</p>
                <p>{videoSettings.goal === "awareness" ? "曝光獲客" :
                   videoSettings.goal === "engagement" ? "互動漲粉" :
                   videoSettings.goal === "trust" ? "建立信任" : "導流變現"}</p>
              </div>
              <Separator />
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setStep(1)
                  setGeneratedScript(null)
                }}
              >
                重新設定
              </Button>
            </CardContent>
          </Card>

          {/* 右側：生成的腳本 */}
          <Card className="lg:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between space-y-0">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  你的專屬腳本
                </CardTitle>
                <CardDescription>
                  根據你的定位和目標量身打造
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="icon" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="p-0">
              <ScrollArea className="h-[500px] p-6">
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {generatedScript}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
