"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronRight,
  Clock,
  Copy,
  Download,
  FileText,
  Lightbulb,
  Music,
  Play,
  RefreshCw,
  Sparkles,
  Target,
  TrendingUp,
  User,
  Video,
  Zap
} from "lucide-react"
import { useState } from "react"

interface ScriptSegment {
  timeRange: string
  visual: string
  voiceover: string
  effect: string
}

interface ScriptVersion {
  id: string
  style: string
  styleDescription: string
  script: {
    title: string
    segments: ScriptSegment[]
    bgm: {
      style: string
      bpm: number
      suggestions: string[]
    }
    cta: string
  }
  shootingTips: string[]
  estimatedMetrics: {
    completionRate: string
    engagementRate: string
    bestPostTime: string
  }
}

const PLATFORMS = [
  { id: "tiktok", label: "抖音/TikTok" },
  { id: "ig_reels", label: "IG Reels" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "xiaohongshu", label: "小紅書" }
]

const EXAMPLE_TOPICS = [
  "新手如何開始投資？3個步驟讓你不再迷茫",
  "上班族必學！15分鐘搞定一週便當",
  "為什麼你的簡歷總是石沉大海？HR不會告訴你的秘密",
  "我靠這個方法，3個月瘦了10公斤"
]

const EXAMPLE_AUDIENCES = [
  "25-35歲上班族，月薪3-5萬，想學理財但不知道從何開始",
  "剛畢業的社會新鮮人，對未來迷茫，想找到自己的方向",
  "30-40歲的職場媽媽，想在工作和家庭間找到平衡"
]

export default function ScriptGeneratorPage() {
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVersions, setGeneratedVersions] = useState<ScriptVersion[]>([])
  const [activeVersion, setActiveVersion] = useState("A")
  const [generateCount, setGenerateCount] = useState(3)

  // Step 1: 創作者背景
  const [creatorBackground, setCreatorBackground] = useState({
    niche: "",
    expertise: "",
    targetAudience: "",
    audiencePainPoints: "",
    contentStyle: "",
    experience: "",
    platforms: [] as string[],
    references: ""
  })

  // Step 2: 影片設定
  const [videoSettings, setVideoSettings] = useState({
    topic: "",
    goal: "",
    duration: 45,
    keyMessage: "",
    cta: "",
    emotionalTone: "",
    specialRequirements: ""
  })

  const handlePlatformChange = (platformId: string, checked: boolean) => {
    if (checked) {
      setCreatorBackground({
        ...creatorBackground,
        platforms: [...creatorBackground.platforms, platformId]
      })
    } else {
      setCreatorBackground({
        ...creatorBackground,
        platforms: creatorBackground.platforms.filter(p => p !== platformId)
      })
    }
  }

  const handleGenerate = async () => {
    setIsGenerating(true)
    setGeneratedVersions([])

    try {
      const response = await fetch("/api/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          creatorBackground,
          videoSettings,
          generateVersions: generateCount
        })
      })

      const data = await response.json()

      if (data.versions && data.versions.length > 0) {
        setGeneratedVersions(data.versions)
        setActiveVersion(data.versions[0].id)
        setStep(3)
      } else {
        alert("生成失敗，請稍後再試")
      }
    } catch (error) {
      console.error("Error:", error)
      alert("發生錯誤，請檢查網路連線")
    } finally {
      setIsGenerating(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatScriptForCopy = (version: ScriptVersion) => {
    let text = `【${version.script.title}】\n\n`
    text += `風格：${version.style} - ${version.styleDescription}\n\n`
    text += `═══════════════════════════════════\n`
    text += `📝 分鏡腳本\n`
    text += `═══════════════════════════════════\n\n`

    version.script.segments.forEach((seg, i) => {
      text += `【${seg.timeRange}】\n`
      text += `🎬 畫面：${seg.visual}\n`
      text += `🎤 口播：${seg.voiceover}\n`
      if (seg.effect) text += `✨ 特效：${seg.effect}\n`
      text += `\n`
    })

    text += `═══════════════════════════════════\n`
    text += `🎵 BGM 建議\n`
    text += `═══════════════════════════════════\n`
    text += `風格：${version.script.bgm.style}\n`
    text += `節奏：${version.script.bgm.bpm} BPM\n`
    text += `推薦：${version.script.bgm.suggestions.join("、")}\n\n`

    text += `═══════════════════════════════════\n`
    text += `📣 結尾 CTA\n`
    text += `═══════════════════════════════════\n`
    text += `${version.script.cta}\n\n`

    text += `═══════════════════════════════════\n`
    text += `📷 拍攝建議\n`
    text += `═══════════════════════════════════\n`
    version.shootingTips.forEach((tip, i) => {
      text += `${i + 1}. ${tip}\n`
    })

    text += `\n═══════════════════════════════════\n`
    text += `📊 預估數據\n`
    text += `═══════════════════════════════════\n`
    text += `完播率：${version.estimatedMetrics.completionRate}\n`
    text += `互動率：${version.estimatedMetrics.engagementRate}\n`
    text += `最佳發布時間：${version.estimatedMetrics.bestPostTime}\n`

    return text
  }

  const canProceedStep1 = creatorBackground.niche && creatorBackground.targetAudience
  const canProceedStep2 = videoSettings.topic && videoSettings.goal

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Video className="h-8 w-8 text-primary" />
          爆款腳本生成器 Pro
        </h1>
        <p className="text-muted-foreground mt-2">
          深度了解你的背景，AI 生成 {generateCount} 個不同風格的專業腳本版本
        </p>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className={step >= 1 ? "text-primary font-medium" : "text-muted-foreground"}>
            1. 創作者背景
          </span>
          <span className={step >= 2 ? "text-primary font-medium" : "text-muted-foreground"}>
            2. 影片設定
          </span>
          <span className={step >= 3 ? "text-primary font-medium" : "text-muted-foreground"}>
            3. 多版本腳本
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1: 創作者背景 */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                第一步：深度了解你的創作者背景
              </CardTitle>
              <CardDescription>
                越詳細的資訊，AI 越能生成符合你風格的腳本
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 基本資訊 */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    你的領域/定位 <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    placeholder="例如：個人理財教學、職場成長..."
                    value={creatorBackground.niche}
                    onChange={(e) => setCreatorBackground({ ...creatorBackground, niche: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    {creatorBackground.niche.length}/50 字
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>創作經驗</Label>
                  <Select
                    value={creatorBackground.experience}
                    onValueChange={(v) => setCreatorBackground({ ...creatorBackground, experience: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="選擇你的經驗程度" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">新手 - 剛開始做自媒體</SelectItem>
                      <SelectItem value="intermediate">有經驗 - 發布過一些內容</SelectItem>
                      <SelectItem value="expert">專業 - 有穩定粉絲基礎</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>你的專業背景/優勢</Label>
                <Textarea
                  placeholder="例如：10年金融業經驗、考過CFP證照、曾幫助超過100位學員..."
                  className="h-20 resize-none"
                  value={creatorBackground.expertise}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, expertise: e.target.value })}
                />
              </div>

              <Separator />

              {/* 目標受眾 */}
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  你的目標受眾是誰？ <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="描述越具體越好（年齡、職業、困擾、渴望）"
                  className="h-24 resize-none"
                  value={creatorBackground.targetAudience}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, targetAudience: e.target.value })}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {EXAMPLE_AUDIENCES.map((example, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1"
                      onClick={() => setCreatorBackground({ ...creatorBackground, targetAudience: example })}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      範例 {i + 1}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>他們最大的痛點/困擾</Label>
                <Textarea
                  placeholder="例如：存不到錢、不知道怎麼開始、資訊太多不知道該信誰..."
                  className="h-20 resize-none"
                  value={creatorBackground.audiencePainPoints}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, audiencePainPoints: e.target.value })}
                />
              </div>

              <Separator />

              {/* 進階設定 */}
              <Accordion type="single" collapsible>
                <AccordionItem value="advanced">
                  <AccordionTrigger className="text-sm">
                    <span className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      進階設定（可選）
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>你的說話風格</Label>
                      <Select
                        value={creatorBackground.contentStyle}
                        onValueChange={(v) => setCreatorBackground({ ...creatorBackground, contentStyle: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="選擇偏好的風格" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">專業權威型 - 像老師一樣教學</SelectItem>
                          <SelectItem value="friendly">親切朋友型 - 像朋友分享經驗</SelectItem>
                          <SelectItem value="energetic">熱血激勵型 - 充滿能量感染力</SelectItem>
                          <SelectItem value="humorous">幽默風趣型 - 輕鬆有趣好消化</SelectItem>
                          <SelectItem value="storytelling">故事敘事型 - 用故事帶出觀點</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>發布平台（可多選）</Label>
                      <div className="grid grid-cols-2 gap-2">
                        {PLATFORMS.map((platform) => (
                          <div key={platform.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={platform.id}
                              checked={creatorBackground.platforms.includes(platform.id)}
                              onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                            />
                            <label htmlFor={platform.id} className="text-sm cursor-pointer">
                              {platform.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>參考帳號/風格</Label>
                      <Input
                        placeholder="例如：想要像 XXX 那樣的風格..."
                        value={creatorBackground.references}
                        onChange={(e) => setCreatorBackground({ ...creatorBackground, references: e.target.value })}
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-8"
                >
                  下一步：設定影片內容
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右側提示卡片 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                填寫技巧
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium text-primary mb-1">領域要具體</p>
                <p className="text-muted-foreground">
                  不要只說「理財」，要說「專門教小資族的基金投資」
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium text-primary mb-1">受眾要精準</p>
                <p className="text-muted-foreground">
                  描述清楚他們的年齡、職業、最大的困擾是什麼
                </p>
              </div>
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="font-medium text-primary mb-1">痛點要深刻</p>
                <p className="text-muted-foreground">
                  想想他們晚上睡不著會煩惱什麼問題
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: 影片設定 */}
      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                第二步：這支影片要達成什麼目標？
              </CardTitle>
              <CardDescription>
                告訴 AI 這支影片的主題和目的
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-1">
                  影片主題 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="這支影片要講什麼？"
                  value={videoSettings.topic}
                  onChange={(e) => setVideoSettings({ ...videoSettings, topic: e.target.value })}
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {EXAMPLE_TOPICS.map((topic, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1"
                      onClick={() => setVideoSettings({ ...videoSettings, topic })}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      範例 {i + 1}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-1">
                    影片目標 <span className="text-destructive">*</span>
                  </Label>
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
                  <Label>情緒調性</Label>
                  <Select
                    value={videoSettings.emotionalTone}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, emotionalTone: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="影片的情緒氛圍" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">專業嚴謹</SelectItem>
                      <SelectItem value="casual">輕鬆隨性</SelectItem>
                      <SelectItem value="humorous">幽默風趣</SelectItem>
                      <SelectItem value="inspirational">勵志激勵</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>影片時長：{videoSettings.duration} 秒</Label>
                  <Badge variant={videoSettings.duration <= 30 ? "default" : videoSettings.duration <= 60 ? "secondary" : "outline"}>
                    {videoSettings.duration <= 30 ? "極短・高完播" : videoSettings.duration <= 60 ? "標準・最常見" : videoSettings.duration <= 90 ? "中長・教學適合" : "長片・深度內容"}
                  </Badge>
                </div>
                <Slider
                  value={[videoSettings.duration]}
                  onValueChange={(v) => setVideoSettings({ ...videoSettings, duration: v[0] })}
                  min={15}
                  max={180}
                  step={5}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15秒</span>
                  <span>60秒</span>
                  <span>120秒</span>
                  <span>180秒</span>
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

              <div className="grid gap-4 md:grid-cols-2">
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
                      <SelectItem value="follow">追蹤帳號 - 「追蹤我看更多乾貨」</SelectItem>
                      <SelectItem value="like">按讚收藏 - 「覺得有用就收藏起來」</SelectItem>
                      <SelectItem value="comment">留言互動 - 「你的看法是什麼？」</SelectItem>
                      <SelectItem value="share">分享給朋友 - 「分享給需要的人」</SelectItem>
                      <SelectItem value="dm">私訊諮詢 - 「想了解更多可以私訊我」</SelectItem>
                      <SelectItem value="link">點擊連結 - 「連結在 bio」</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>生成版本數量</Label>
                  <Select
                    value={generateCount.toString()}
                    onValueChange={(v) => setGenerateCount(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3">3 個版本（推薦）</SelectItem>
                      <SelectItem value="4">4 個版本</SelectItem>
                      <SelectItem value="5">5 個版本（完整）</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>特殊需求（可選）</Label>
                <Textarea
                  placeholder="例如：需要包含某個關鍵字、避免某些內容、有特定的拍攝限制..."
                  className="h-20 resize-none"
                  value={videoSettings.specialRequirements}
                  onChange={(e) => setVideoSettings({ ...videoSettings, specialRequirements: e.target.value })}
                />
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
                      <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                      AI 正在生成 {generateCount} 個版本...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成 {generateCount} 個專屬腳本
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右側摘要 */}
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-lg">設定摘要</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">領域定位</p>
                <p className="font-medium">{creatorBackground.niche || "-"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">目標受眾</p>
                <p className="font-medium line-clamp-2">{creatorBackground.targetAudience || "-"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">影片主題</p>
                <p className="font-medium">{videoSettings.topic || "-"}</p>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground">生成版本</p>
                <p className="font-medium">{generateCount} 個不同風格</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3: 生成結果 */}
      {step === 3 && generatedVersions.length > 0 && (
        <div className="space-y-6">
          {/* 版本切換 Tabs */}
          <Tabs value={activeVersion} onValueChange={setActiveVersion}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList className="h-auto p-1">
                {generatedVersions.map((version) => (
                  <TabsTrigger
                    key={version.id}
                    value={version.id}
                    className="px-4 py-2"
                  >
                    <span className="font-bold mr-2">版本 {version.id}</span>
                    <Badge variant="outline" className="text-xs">
                      {version.style}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Play className="h-4 w-4 mr-1" />
                      版本對比
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>版本對比</DialogTitle>
                      <DialogDescription>
                        比較不同版本的開頭和風格差異
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 mt-4">
                      {generatedVersions.map((version) => (
                        <Card key={version.id}>
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <Badge>{version.style}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {version.styleDescription}
                              </span>
                            </div>
                            <CardTitle className="text-lg">{version.script.title}</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm">
                              <span className="font-medium">開頭：</span>
                              {version.script.segments[0]?.voiceover || "-"}
                            </p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </DialogContent>
                </Dialog>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStep(2)
                    setGeneratedVersions([])
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-1" />
                  重新生成
                </Button>
              </div>
            </div>

            {generatedVersions.map((version) => (
              <TabsContent key={version.id} value={version.id}>
                <div className="grid gap-6 lg:grid-cols-3">
                  {/* 主要腳本內容 */}
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <Badge className="mb-2">{version.style}</Badge>
                          <CardTitle className="text-xl">{version.script.title}</CardTitle>
                          <CardDescription>{version.styleDescription}</CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard(formatScriptForCopy(version))}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px]">
                        <div className="p-6 space-y-6">
                          {/* 分鏡腳本 */}
                          <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                              <FileText className="h-4 w-4 text-primary" />
                              分鏡腳本
                            </h3>
                            <div className="space-y-4">
                              {version.script.segments.map((segment, index) => (
                                <div
                                  key={index}
                                  className="p-4 rounded-lg border bg-muted/30"
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      <Clock className="h-3 w-3 mr-1" />
                                      {segment.timeRange}
                                    </Badge>
                                    {segment.effect && (
                                      <Badge variant="secondary" className="text-xs">
                                        {segment.effect}
                                      </Badge>
                                    )}
                                  </div>
                                  <div className="grid gap-2 text-sm">
                                    <div>
                                      <span className="text-muted-foreground">🎬 畫面：</span>
                                      <span>{segment.visual}</span>
                                    </div>
                                    <div>
                                      <span className="text-muted-foreground">🎤 口播：</span>
                                      <span className="font-medium">{segment.voiceover}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <Separator />

                          {/* BGM 建議 */}
                          <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                              <Music className="h-4 w-4 text-primary" />
                              BGM 建議
                            </h3>
                            <div className="p-4 rounded-lg border bg-primary/5">
                              <div className="grid gap-2 text-sm">
                                <div>
                                  <span className="text-muted-foreground">風格：</span>
                                  <span className="font-medium">{version.script.bgm.style}</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">節奏：</span>
                                  <span className="font-medium">{version.script.bgm.bpm} BPM</span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">推薦：</span>
                                  <span>{version.script.bgm.suggestions.join("、")}</span>
                                </div>
                              </div>
                            </div>
                          </div>

                          <Separator />

                          {/* CTA */}
                          <div>
                            <h3 className="font-semibold flex items-center gap-2 mb-4">
                              <Target className="h-4 w-4 text-primary" />
                              結尾 CTA
                            </h3>
                            <div className="p-4 rounded-lg border bg-green-500/10 border-green-500/20">
                              <p className="font-medium text-green-700">{version.script.cta}</p>
                            </div>
                          </div>
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* 右側資訊 */}
                  <div className="space-y-6">
                    {/* 拍攝建議 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Video className="h-5 w-5 text-primary" />
                          拍攝建議
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {version.shootingTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <span className="text-primary font-bold">{index + 1}.</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>

                    {/* 預估數據 */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <TrendingUp className="h-5 w-5 text-primary" />
                          預估數據
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">完播率</span>
                          <Badge variant="success">{version.estimatedMetrics.completionRate}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">互動率</span>
                          <Badge variant="secondary">{version.estimatedMetrics.engagementRate}</Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">最佳發布</span>
                          <Badge variant="outline">{version.estimatedMetrics.bestPostTime}</Badge>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 操作按鈕 */}
                    <Card>
                      <CardContent className="pt-6 space-y-2">
                        <Button
                          className="w-full"
                          onClick={() => copyToClipboard(formatScriptForCopy(version))}
                        >
                          <Copy className="h-4 w-4 mr-2" />
                          複製完整腳本
                        </Button>
                        <Button variant="outline" className="w-full">
                          <Download className="h-4 w-4 mr-2" />
                          下載為文件
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  )
}
