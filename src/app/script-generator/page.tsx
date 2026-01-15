"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
  ArrowLeft,
  ArrowRight,
  Check,
  Clock,
  Copy,
  Download,
  Lightbulb,
  Mic,
  RefreshCw,
  Settings,
  Sparkles,
  Target,
  User,
  Users,
  Video
} from "lucide-react"
import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"
import { PositioningSelector, type SelectedPositioning } from "@/components/positioning"

// 升級版分鏡結構 - 支援更多專業欄位
interface ScriptSegment {
  segmentId?: number
  segmentName?: string          // 段落名稱（HOOK/CONTENT/CTA）
  timeRange: string
  duration?: string
  visual: string
  voiceover: string
  textOverlay?: string          // 螢幕字卡
  effect: string
  sound?: string                // 音效建議
  note?: string
  emotionalBeat?: string        // 情緒節奏
}

// 升級版腳本結構 - 支援專業框架和更多輸出
interface ScriptVersion {
  id: string
  style: string
  styleDescription: string
  framework?: string            // 使用的框架（HOOK-CONTENT-CTA / PAS / 故事三幕式 / 清單式）
  script: {
    title: string
    subtitle?: string           // 副標題或 hashtag
    totalDuration?: string
    pacing?: string             // 節奏建議
    castInfo?: string
    segments: ScriptSegment[]
    bgm: {
      style: string
      mood?: string
      bpm?: string | number
      suggestions: string[]
    }
    soundEffects?: string[]     // 音效列表
    cta: string
    ctaTiming?: string          // CTA 出現時機
  }
  visualStyle?: {               // 視覺風格建議
    colorTone?: string
    fontStyle?: string
    transitionStyle?: string
  }
  shootingTips: string[]
  editingTips?: string[]        // 剪輯建議
  equipmentNeeded?: string[]
  locationSuggestion?: string   // 場地建議
  estimatedMetrics: {
    completionRate: string
    engagementRate: string
    saveRate?: string           // 收藏率
    shareability?: string       // 分享潛力
    bestPostTime: string
    bestPlatform?: string       // 最適合平台
  }
  warnings?: string[]           // 注意事項
  alternativeHooks?: string[]   // 備選 HOOK
}

const PLATFORMS = [
  { id: "tiktok", label: "抖音 / TikTok" },
  { id: "ig_reels", label: "IG Reels" },
  { id: "youtube_shorts", label: "YouTube Shorts" },
  { id: "xiaohongshu", label: "小紅書" }
]

const EXAMPLE_NICHES = [
  "個人理財教學",
  "職場成長攻略",
  "健身減脂知識",
  "料理食譜分享",
  "美妝保養技巧",
]

const EXAMPLE_TOPICS = [
  "新手如何開始投資？3個步驟讓你不再迷茫",
  "上班族必學！15分鐘搞定一週便當",
  "面試必勝的 3 個秘訣",
  "我靠這個方法，3個月瘦了10公斤"
]

// 各方案的腳本版本數上限
const TIER_SCRIPT_LIMITS = {
  free: 2,
  creator: 3,
  pro: 5,
  lifetime: 5,
} as const

export default function ScriptGeneratorPage() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVersions, setGeneratedVersions] = useState<ScriptVersion[]>([])
  const [activeVersion, setActiveVersion] = useState("A")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"simple" | "professional">("simple") // 檢視模式
  const [selectedPositioningId, setSelectedPositioningId] = useState<string | null>(null)

  const { canUseFeature, useCredit, display, credits } = useCredits()

  // 根據訂閱等級決定可生成的版本數
  const maxVersions = TIER_SCRIPT_LIMITS[credits?.tier || 'free']
  const [generateCount, setGenerateCount] = useState(2) // 預設值，會在 useEffect 中更新

  // 當 credits 載入後，更新 generateCount 為該方案的上限
  useEffect(() => {
    if (credits) {
      const limit = TIER_SCRIPT_LIMITS[credits.tier]
      setGenerateCount(limit)
    }
  }, [credits?.tier])

  // 從 URL 參數載入定位 ID
  useEffect(() => {
    const positioningId = searchParams.get('positioning')
    if (positioningId) {
      setSelectedPositioningId(positioningId)
      // 載入定位資料
      loadPositioningData(positioningId)
    }
  }, [searchParams])

  // 載入指定的定位資料
  const loadPositioningData = async (positioningId: string) => {
    try {
      const response = await fetch('/api/positioning/history')
      const data = await response.json()
      if (data.records) {
        const record = data.records.find((r: { id: string }) => r.id === positioningId)
        if (record) {
          handlePositioningSelect({
            id: record.id,
            niche: record.output_data.niche || record.input_data.expertise || '',
            expertise: record.input_data.expertise || '',
            targetAudience: record.output_data.targetAudience?.who || record.input_data.targetAudience || '',
            audiencePainPoints: record.input_data.painPoints || '',
            contentStyle: record.input_data.contentStyle || 'mixed',
            platforms: record.input_data.platforms || [],
            positioningStatement: record.output_data.positioningStatement || '',
            contentPillars: record.output_data.contentPillars?.map((p: { pillar: string }) => p.pillar) || [],
            personaTags: record.output_data.personaTags || []
          })
        }
      }
    } catch (error) {
      console.error('Failed to load positioning data:', error)
    }
  }

  // 處理定位選擇
  const handlePositioningSelect = (positioning: SelectedPositioning | null) => {
    if (positioning) {
      setSelectedPositioningId(positioning.id)
      setCreatorBackground({
        ...creatorBackground,
        niche: positioning.niche,
        expertise: positioning.expertise,
        targetAudience: positioning.targetAudience,
        audiencePainPoints: positioning.audiencePainPoints,
        contentStyle: positioning.contentStyle,
        platforms: positioning.platforms
      })
    } else {
      setSelectedPositioningId(null)
    }
  }

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

  const [videoSettings, setVideoSettings] = useState({
    topic: "",
    goal: "",
    duration: 45,
    keyMessage: "",
    cta: "",
    emotionalTone: "",
    specialRequirements: "",
    shootingType: "",
    castCount: ""
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
    // 檢查額度
    const creditCheck = canUseFeature('script')
    if (!creditCheck.canUse) {
      setCreditError(creditCheck.message || '額度不足')
      return
    }

    setCreditError(null)
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
        // 成功生成後扣除額度
        if (data._creditConsumed) {
          useCredit('script')
        }
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

  const copyToClipboard = (text: string, id?: string) => {
    navigator.clipboard.writeText(text)
    if (id) {
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  // 升級版複製格式 - 包含更多專業內容
  const formatScriptForCopy = (version: ScriptVersion) => {
    let text = `════════════════════════════════════════════════════════════\n`
    text += `                    短影音腳本                              \n`
    text += `════════════════════════════════════════════════════════════\n\n`

    text += `【${version.script.title}】\n`
    if (version.script.subtitle) text += `${version.script.subtitle}\n`
    text += `\n`
    text += `風格：${version.style} - ${version.styleDescription}\n`
    if (version.framework) text += `框架：${version.framework}\n`
    if (version.script.totalDuration) text += `時長：${version.script.totalDuration}\n`
    if (version.script.pacing) text += `節奏：${version.script.pacing}\n`
    text += `\n`

    text += `════════════════════════════════════════════════════════════\n`
    text += `  分鏡腳本\n`
    text += `════════════════════════════════════════════════════════════\n\n`

    version.script.segments.forEach((seg, index) => {
      const segName = seg.segmentName ? `【${seg.segmentName}】` : `【第 ${index + 1} 段】`
      text += `${segName} ${seg.timeRange}\n`
      text += `────────────────────────────────────\n`
      text += `畫面：${seg.visual}\n`
      text += `口播：${seg.voiceover}\n`
      if (seg.textOverlay) text += `字卡：${seg.textOverlay}\n`
      if (seg.effect) text += `特效：${seg.effect}\n`
      if (seg.sound) text += `音效：${seg.sound}\n`
      if (seg.emotionalBeat) text += `情緒：${seg.emotionalBeat}\n`
      if (seg.note) text += `備註：${seg.note}\n`
      text += `\n`
    })

    text += `════════════════════════════════════════════════════════════\n`
    text += `  BGM 建議\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `風格：${version.script.bgm.style}\n`
    if (version.script.bgm.mood) text += `氛圍：${version.script.bgm.mood}\n`
    if (version.script.bgm.bpm) text += `節奏：${version.script.bgm.bpm} BPM\n`
    if (version.script.bgm.suggestions?.length > 0) {
      text += `推薦：${version.script.bgm.suggestions.join("、")}\n`
    }
    if (version.script.soundEffects && version.script.soundEffects.length > 0) {
      text += `音效：${version.script.soundEffects.join("、")}\n`
    }
    text += `\n`

    text += `════════════════════════════════════════════════════════════\n`
    text += `  結尾 CTA\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `${version.script.cta}\n`
    if (version.script.ctaTiming) text += `時機：${version.script.ctaTiming}\n`
    text += `\n`

    if (version.visualStyle) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  視覺風格建議\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      if (version.visualStyle.colorTone) text += `色調：${version.visualStyle.colorTone}\n`
      if (version.visualStyle.fontStyle) text += `字型：${version.visualStyle.fontStyle}\n`
      if (version.visualStyle.transitionStyle) text += `轉場：${version.visualStyle.transitionStyle}\n`
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  拍攝建議\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    version.shootingTips.forEach((tip, i) => {
      text += `${i + 1}. ${tip}\n`
    })
    if (version.locationSuggestion) text += `\n場地建議：${version.locationSuggestion}\n`
    if (version.equipmentNeeded && version.equipmentNeeded.length > 0) {
      text += `器材需求：${version.equipmentNeeded.join("、")}\n`
    }
    text += `\n`

    if (version.editingTips && version.editingTips.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  剪輯建議\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      version.editingTips.forEach((tip, i) => {
        text += `${i + 1}. ${tip}\n`
      })
      text += `\n`
    }

    if (version.alternativeHooks && version.alternativeHooks.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  備選 HOOK\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      version.alternativeHooks.forEach((hook, i) => {
        text += `${i + 1}. ${hook}\n`
      })
      text += `\n`
    }

    if (version.warnings && version.warnings.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  注意事項\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      version.warnings.forEach((w, i) => {
        text += `${i + 1}. ${w}\n`
      })
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  預估表現\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `完播率：${version.estimatedMetrics.completionRate}\n`
    text += `互動率：${version.estimatedMetrics.engagementRate}\n`
    if (version.estimatedMetrics.saveRate) text += `收藏率：${version.estimatedMetrics.saveRate}\n`
    if (version.estimatedMetrics.shareability) text += `分享潛力：${version.estimatedMetrics.shareability}\n`
    text += `最佳發布：${version.estimatedMetrics.bestPostTime}\n`
    if (version.estimatedMetrics.bestPlatform) text += `最適平台：${version.estimatedMetrics.bestPlatform}\n`

    text += `\n════════════════════════════════════════════════════════════\n`

    return text
  }

  // 下載腳本為 TXT 檔案
  const downloadScript = (version: ScriptVersion) => {
    const text = formatScriptForCopy(version)
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `腳本_${version.style}_${version.script.title.slice(0, 15)}_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const canProceedStep1 = creatorBackground.niche && creatorBackground.targetAudience
  const canProceedStep2 = videoSettings.topic && videoSettings.goal

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Video className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            腳本生成器
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground truncate">
            AI 為你生成最多 {maxVersions} 個不同風格的專業腳本
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              剩餘 {display.script}
            </span>
          </p>
        </div>
      </div>

      {/* Progress */}
      <div className="bg-muted/30 rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          {[
            { num: 1, label: "背景", labelFull: "創作者背景", icon: User },
            { num: 2, label: "設定", labelFull: "影片設定", icon: Target },
            { num: 3, label: "結果", labelFull: "生成結果", icon: Sparkles },
          ].map((item, index) => (
            <div key={item.num} className="flex items-center flex-1 justify-center sm:justify-start sm:flex-initial">
              <div className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${step >= item.num ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  step > item.num
                    ? "bg-primary text-primary-foreground"
                    : step === item.num
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {step > item.num ? <Check className="h-4 w-4" /> : item.num}
                </div>
                <span className="text-xs sm:text-sm font-medium sm:hidden">{item.label}</span>
                <span className="hidden sm:block text-sm font-medium">{item.labelFull}</span>
              </div>
              {index < 2 && (
                <div className={`hidden sm:block w-8 md:w-12 lg:w-24 h-0.5 mx-2 ${
                  step > item.num ? "bg-primary" : "bg-muted"
                }`} />
              )}
            </div>
          ))}
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Step 1 */}
      {step === 1 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Step 1：創作者背景
              </CardTitle>
              <CardDescription>
                填寫你的領域和目標受眾，AI 會根據這些資訊生成更精準的腳本
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 定位選擇器 - 快速帶入過去的定位分析 */}
              <div className="space-y-3">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  快速帶入定位
                </Label>
                <PositioningSelector
                  onSelect={handlePositioningSelect}
                  selectedId={selectedPositioningId}
                />
                {selectedPositioningId && (
                  <p className="text-xs text-muted-foreground">
                    已自動帶入定位資料，你仍可以手動調整下方欄位
                  </p>
                )}
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  你的領域 / 定位 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="例如：個人理財教學、職場成長、健身減脂..."
                  value={creatorBackground.niche}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, niche: e.target.value })}
                  className="h-11"
                />
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_NICHES.map((item) => (
                    <Button
                      key={item}
                      variant={creatorBackground.niche === item ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCreatorBackground({ ...creatorBackground, niche: item })}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  目標受眾 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="描述你的目標觀眾，例如：25-35歲上班族，想學投資但不知道從何開始..."
                  className="min-h-[100px] resize-none"
                  value={creatorBackground.targetAudience}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, targetAudience: e.target.value })}
                />
              </div>

              <Separator />

              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="advanced" className="border rounded-lg px-4">
                  <AccordionTrigger className="hover:no-underline">
                    <span className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      <span className="font-medium">進階設定</span>
                      <Badge variant="secondary" className="text-xs">選填</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="space-y-4 pt-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label>創作經驗</Label>
                        <Select
                          value={creatorBackground.experience}
                          onValueChange={(v) => setCreatorBackground({ ...creatorBackground, experience: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇經驗程度" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">新手 - 剛開始做自媒體</SelectItem>
                            <SelectItem value="intermediate">有經驗 - 發布過一些內容</SelectItem>
                            <SelectItem value="expert">專業 - 有穩定粉絲基礎</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>說話風格</Label>
                        <Select
                          value={creatorBackground.contentStyle}
                          onValueChange={(v) => setCreatorBackground({ ...creatorBackground, contentStyle: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="選擇風格" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="relatable">共鳴同理型（推薦）</SelectItem>
                            <SelectItem value="professional">專業權威型</SelectItem>
                            <SelectItem value="friendly">親切朋友型</SelectItem>
                            <SelectItem value="energetic">熱血激勵型</SelectItem>
                            <SelectItem value="humorous">幽默風趣型</SelectItem>
                            <SelectItem value="storytelling">故事敘事型</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>專業背景</Label>
                      <Textarea
                        placeholder="例如：10年金融業經驗、有營養師證照..."
                        className="h-20 resize-none"
                        value={creatorBackground.expertise}
                        onChange={(e) => setCreatorBackground({ ...creatorBackground, expertise: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>發布平台（可多選）</Label>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {PLATFORMS.map((platform) => (
                          <div
                            key={platform.id}
                            className={`flex items-center gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-all ${
                              creatorBackground.platforms.includes(platform.id)
                                ? "border-primary bg-primary/5"
                                : "hover:border-muted-foreground/50"
                            }`}
                            onClick={() => handlePlatformChange(platform.id, !creatorBackground.platforms.includes(platform.id))}
                          >
                            <Checkbox
                              checked={creatorBackground.platforms.includes(platform.id)}
                              onCheckedChange={(checked) => handlePlatformChange(platform.id, checked as boolean)}
                            />
                            <span className="text-sm">{platform.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-8"
                >
                  下一步
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                填寫提示
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">領域要具體</p>
                <p className="text-muted-foreground mt-1">不要只說「理財」，要說「教小資族基金投資」</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50">
                <p className="font-medium">受眾要精準</p>
                <p className="text-muted-foreground mt-1">描述具體的年齡、職業、困擾</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2 */}
      {step === 2 && (
        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Step 2：影片設定
              </CardTitle>
              <CardDescription>
                設定這支影片的主題、目標和拍攝方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  影片主題 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="這支影片要講什麼內容？"
                  value={videoSettings.topic}
                  onChange={(e) => setVideoSettings({ ...videoSettings, topic: e.target.value })}
                  className="h-11"
                />
                <div className="flex flex-wrap gap-2">
                  {EXAMPLE_TOPICS.map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => setVideoSettings({ ...videoSettings, topic: item })}
                    >
                      {item.slice(0, 20)}...
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>
                    影片目標 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={videoSettings.goal}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, goal: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="選擇目標" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="awareness">曝光獲客 - 讓更多人認識你</SelectItem>
                      <SelectItem value="engagement">互動漲粉 - 增加留言分享</SelectItem>
                      <SelectItem value="trust">建立信任 - 展現專業度</SelectItem>
                      <SelectItem value="conversion">導流變現 - 引導購買/諮詢</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Mic className="h-4 w-4" />
                    拍攝方式
                  </Label>
                  <Select
                    value={videoSettings.shootingType}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, shootingType: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="選擇拍攝方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="talking_head">口播型 - 對著鏡頭說話</SelectItem>
                      <SelectItem value="voiceover">藏鏡人 - 只有聲音配畫面</SelectItem>
                      <SelectItem value="acting">演戲型 - 有劇情有對話</SelectItem>
                      <SelectItem value="vlog">Vlog - 生活記錄風格</SelectItem>
                      <SelectItem value="tutorial">教學型 - 邊做邊說</SelectItem>
                      <SelectItem value="interview">訪談型 - 對談聊天</SelectItem>
                      <SelectItem value="storytime">說故事 - 敘事型內容</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    演員人數
                  </Label>
                  <Select
                    value={videoSettings.castCount}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, castCount: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="選擇人數" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solo">1 人 - 自己拍</SelectItem>
                      <SelectItem value="duo">2 人 - 需要搭檔</SelectItem>
                      <SelectItem value="group">3 人以上 - 團隊</SelectItem>
                      <SelectItem value="flexible">彈性 - 都可以</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>影片氛圍</Label>
                  <Select
                    value={videoSettings.emotionalTone}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, emotionalTone: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="選擇氛圍" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="relatable">共鳴感（推薦）</SelectItem>
                      <SelectItem value="professional">專業嚴謹</SelectItem>
                      <SelectItem value="casual">輕鬆隨性</SelectItem>
                      <SelectItem value="humorous">幽默搞笑</SelectItem>
                      <SelectItem value="inspirational">勵志激勵</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4 p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    影片長度：{videoSettings.duration} 秒
                  </Label>
                  <Badge variant={
                    videoSettings.duration <= 30 ? "default" :
                    videoSettings.duration <= 60 ? "secondary" : "outline"
                  }>
                    {videoSettings.duration <= 30 ? "極短 / 高完播" :
                     videoSettings.duration <= 60 ? "標準 / 最常見" :
                     videoSettings.duration <= 90 ? "中長 / 教學適合" : "長片 / 深度內容"}
                  </Badge>
                </div>
                <Slider
                  value={[videoSettings.duration]}
                  onValueChange={(v) => setVideoSettings({ ...videoSettings, duration: v[0] })}
                  min={15}
                  max={180}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15秒</span>
                  <span>60秒</span>
                  <span>120秒</span>
                  <span>180秒</span>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>結尾 CTA</Label>
                  <Select
                    value={videoSettings.cta}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, cta: v })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="選擇行動呼籲" />
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

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    生成版本數
                    {maxVersions < 5 && (
                      <Badge variant="outline" className="text-xs font-normal">
                        上限 {maxVersions} 個
                      </Badge>
                    )}
                  </Label>
                  {maxVersions <= 2 ? (
                    // 免費版固定 2 個，不能選擇
                    <div className="h-11 px-3 border rounded-md flex items-center justify-between bg-muted/50">
                      <span className="text-sm">{maxVersions} 個版本</span>
                      <Badge variant="secondary" className="text-xs">免費版上限</Badge>
                    </div>
                  ) : (
                    <Select
                      value={generateCount.toString()}
                      onValueChange={(v) => setGenerateCount(Math.min(parseInt(v), maxVersions))}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {maxVersions >= 3 && <SelectItem value="3">3 個版本{maxVersions === 3 ? '（上限）' : ''}</SelectItem>}
                        {maxVersions >= 4 && <SelectItem value="4">4 個版本</SelectItem>}
                        {maxVersions >= 5 && <SelectItem value="5">5 個版本（推薦）</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>特殊需求（選填）</Label>
                <Textarea
                  placeholder="例如：想要搞笑風格、需要包含特定關鍵字..."
                  className="h-20 resize-none"
                  value={videoSettings.specialRequirements}
                  onChange={(e) => setVideoSettings({ ...videoSettings, specialRequirements: e.target.value })}
                />
              </div>

              {/* 額度不足提示 */}
              {creditError && (
                <CreditsAlert message={creditError} featureType="script" />
              )}

              <div className="flex justify-between pt-4">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
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
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      生成 {generateCount} 個腳本
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="text-base">目前設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">領域</p>
                <p className="font-medium">{creatorBackground.niche || "—"}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">目標受眾</p>
                <p className="font-medium line-clamp-2">{creatorBackground.targetAudience || "—"}</p>
              </div>
              <Separator />
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">影片主題</p>
                <p className="font-medium">{videoSettings.topic || "—"}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{videoSettings.duration}秒</Badge>
                <Badge variant="secondary">{generateCount} 版本</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 3 */}
      {step === 3 && generatedVersions.length > 0 && (
        <div className="space-y-6">
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="py-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">生成完成</p>
                    <p className="text-sm text-muted-foreground">
                      已生成 {generatedVersions.length} 個不同風格的腳本版本
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => {
                    setStep(2)
                    setGeneratedVersions([])
                  }}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  重新生成
                </Button>
              </div>
            </CardContent>
          </Card>

          <Tabs value={activeVersion} onValueChange={setActiveVersion}>
            <TabsList className="w-full justify-start h-auto p-1 flex-wrap gap-1 overflow-x-auto">
              {generatedVersions.map((version) => (
                <TabsTrigger
                  key={version.id}
                  value={version.id}
                  className="px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm flex-shrink-0"
                >
                  <span className="sm:hidden">{version.id}</span>
                  <span className="hidden sm:inline">版本 {version.id}</span>
                  <Badge variant="outline" className="ml-1.5 sm:ml-2 text-xs hidden sm:inline-flex">
                    {version.style}
                  </Badge>
                </TabsTrigger>
              ))}
            </TabsList>

            {generatedVersions.map((version) => (
              <TabsContent key={version.id} value={version.id} className="mt-4 sm:mt-6">
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
                  {/* 主要腳本內容 */}
                  <Card className="lg:col-span-2">
                    <CardHeader className="pb-3 sm:pb-4 px-4 sm:px-6">
                      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <Badge>{version.style}</Badge>
                            {version.framework && (
                              <Badge variant="outline">{version.framework}</Badge>
                            )}
                          </div>
                          <CardTitle className="text-base sm:text-lg leading-tight">{version.script.title}</CardTitle>
                          {version.script.subtitle && (
                            <p className="text-xs text-muted-foreground mt-1">{version.script.subtitle}</p>
                          )}
                          <CardDescription className="mt-1 text-sm">{version.styleDescription}</CardDescription>
                          {version.script.totalDuration && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              <Badge variant="secondary" className="text-xs">{version.script.totalDuration}</Badge>
                              {version.script.pacing && (
                                <Badge variant="secondary" className="text-xs">{version.script.pacing}</Badge>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant={copiedId === version.id ? "default" : "outline"}
                            size="sm"
                            onClick={() => copyToClipboard(formatScriptForCopy(version), version.id)}
                            className="flex-1 sm:flex-initial"
                          >
                            {copiedId === version.id ? (
                              <>
                                <Check className="h-4 w-4 mr-1" />
                                已複製
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-1" />
                                複製
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadScript(version)}
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="p-0">
                      <ScrollArea className="h-[500px] sm:h-[600px]">
                        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                          {/* 分鏡腳本 */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-sm sm:text-base">分鏡腳本</h3>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground hidden sm:inline">共 {version.script.segments.length} 個分鏡</span>
                                {/* 檢視模式切換 - 專業版以上才能用專業分鏡表 */}
                                <div className="flex border rounded-md overflow-hidden text-xs">
                                  <button
                                    onClick={() => setViewMode("simple")}
                                    className={`px-2 py-1 ${viewMode === "simple" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"}`}
                                  >
                                    簡潔
                                  </button>
                                  {credits?.tier === 'pro' || credits?.tier === 'lifetime' ? (
                                    <button
                                      onClick={() => setViewMode("professional")}
                                      className={`px-2 py-1 ${viewMode === "professional" ? "bg-primary text-primary-foreground" : "bg-muted/50 hover:bg-muted"}`}
                                    >
                                      專業
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => alert('專業分鏡表為專業版以上功能，請升級方案')}
                                      className="px-2 py-1 bg-muted/30 text-muted-foreground cursor-not-allowed flex items-center gap-1"
                                      title="專業版以上功能"
                                    >
                                      專業
                                      <span className="text-[9px] bg-orange-100 text-orange-600 px-1 rounded">PRO</span>
                                    </button>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* 簡潔版 - 卡片式 */}
                            {viewMode === "simple" && (
                              <div className="space-y-3">
                                {version.script.segments.map((segment, index) => (
                                  <div key={index} className="p-3 sm:p-4 rounded-lg border bg-muted/30">
                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                      {segment.segmentName && (
                                        <Badge className="text-xs">{segment.segmentName}</Badge>
                                      )}
                                      <Badge variant="secondary" className="text-xs">{segment.timeRange}</Badge>
                                    </div>
                                    <div className="space-y-2 text-sm">
                                      <p className="text-muted-foreground">{segment.visual}</p>
                                      <p className="font-medium bg-primary/5 p-2 rounded">{segment.voiceover}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* 專業版 - 表格式分鏡表 */}
                            {viewMode === "professional" && (
                              <>
                                {/* 桌面版表格 */}
                                <div className="hidden md:block border rounded-lg overflow-hidden">
                                  <table className="w-full text-sm">
                                    <thead className="bg-muted/70">
                                      <tr>
                                        <th className="px-3 py-2.5 text-left font-semibold w-[90px] border-r">時間軸</th>
                                        <th className="px-3 py-2.5 text-left font-semibold border-r">畫面/運鏡</th>
                                        <th className="px-3 py-2.5 text-left font-semibold border-r">台詞/口播</th>
                                        <th className="px-3 py-2.5 text-left font-semibold w-[140px]">字卡/音效</th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                      {version.script.segments.map((segment, index) => (
                                        <tr key={index} className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}>
                                          <td className="px-3 py-3 align-top border-r">
                                            <div className="space-y-1">
                                              {segment.segmentName && (
                                                <Badge variant="default" className="text-[10px] block w-fit mb-1">{segment.segmentName}</Badge>
                                              )}
                                              <p className="text-xs font-mono font-medium">{segment.timeRange}</p>
                                              {segment.emotionalBeat && (
                                                <p className="text-[10px] text-muted-foreground mt-1">{segment.emotionalBeat}</p>
                                              )}
                                            </div>
                                          </td>
                                          <td className="px-3 py-3 align-top border-r">
                                            <p className="text-sm leading-relaxed">{segment.visual}</p>
                                            {segment.note && (
                                              <p className="text-xs text-orange-600 mt-2 p-1.5 bg-orange-50 rounded">* {segment.note}</p>
                                            )}
                                          </td>
                                          <td className="px-3 py-3 align-top border-r">
                                            <div className="bg-blue-50 border-l-3 border-blue-400 p-2.5 rounded-r">
                                              <p className="text-sm leading-relaxed">{segment.voiceover}</p>
                                            </div>
                                          </td>
                                          <td className="px-3 py-3 align-top">
                                            <div className="space-y-1.5 text-xs">
                                              {segment.textOverlay && (
                                                <div className="p-1.5 bg-yellow-50 rounded">
                                                  <span className="text-yellow-700 font-medium">字卡</span>
                                                  <p className="mt-0.5">{segment.textOverlay}</p>
                                                </div>
                                              )}
                                              {segment.effect && (
                                                <div className="p-1.5 bg-purple-50 rounded">
                                                  <span className="text-purple-700 font-medium">特效</span>
                                                  <p className="mt-0.5">{segment.effect}</p>
                                                </div>
                                              )}
                                              {segment.sound && (
                                                <div className="p-1.5 bg-green-50 rounded">
                                                  <span className="text-green-700 font-medium">音效</span>
                                                  <p className="mt-0.5">{segment.sound}</p>
                                                </div>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>

                                {/* 手機版專業卡片 */}
                                <div className="md:hidden space-y-3">
                                  {version.script.segments.map((segment, index) => (
                                    <div key={index} className="border rounded-lg overflow-hidden">
                                      <div className="bg-muted/70 px-3 py-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs font-mono font-medium">#{index + 1}</span>
                                          {segment.segmentName && (
                                            <Badge className="text-[10px]">{segment.segmentName}</Badge>
                                          )}
                                        </div>
                                        <span className="text-xs font-mono">{segment.timeRange}</span>
                                      </div>
                                      <div className="divide-y">
                                        <div className="p-3">
                                          <p className="text-[10px] font-semibold text-muted-foreground mb-1">畫面/運鏡</p>
                                          <p className="text-sm">{segment.visual}</p>
                                          {segment.note && (
                                            <p className="text-xs text-orange-600 mt-2 p-1.5 bg-orange-50 rounded">* {segment.note}</p>
                                          )}
                                        </div>
                                        <div className="p-3 bg-blue-50/50">
                                          <p className="text-[10px] font-semibold text-blue-700 mb-1">台詞/口播</p>
                                          <p className="text-sm font-medium">{segment.voiceover}</p>
                                        </div>
                                        {(segment.textOverlay || segment.effect || segment.sound || segment.emotionalBeat) && (
                                          <div className="p-3 space-y-2">
                                            {segment.emotionalBeat && (
                                              <div className="text-xs">
                                                <span className="text-muted-foreground">情緒：</span>
                                                <span>{segment.emotionalBeat}</span>
                                              </div>
                                            )}
                                            <div className="flex flex-wrap gap-1.5">
                                              {segment.textOverlay && (
                                                <span className="text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded">字卡：{segment.textOverlay}</span>
                                              )}
                                              {segment.effect && (
                                                <span className="text-xs px-2 py-1 bg-purple-100 text-purple-800 rounded">特效：{segment.effect}</span>
                                              )}
                                              {segment.sound && (
                                                <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded">音效：{segment.sound}</span>
                                              )}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          <Separator />

                          {/* BGM 建議 */}
                          <div>
                            <h3 className="font-semibold mb-3">BGM 建議</h3>
                            <div className="p-4 rounded-lg bg-muted/30 space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">風格</span>
                                <span className="font-medium">{version.script.bgm.style}</span>
                              </div>
                              {version.script.bgm.mood && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">氛圍</span>
                                  <span>{version.script.bgm.mood}</span>
                                </div>
                              )}
                              {version.script.bgm.bpm && (
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">節奏</span>
                                  <span>{version.script.bgm.bpm} BPM</span>
                                </div>
                              )}
                              {version.script.bgm.suggestions && version.script.bgm.suggestions.length > 0 && (
                                <div className="pt-2">
                                  <span className="text-muted-foreground">推薦曲目：</span>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {version.script.bgm.suggestions.map((s, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">{s}</Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {version.script.soundEffects && version.script.soundEffects.length > 0 && (
                                <div className="pt-2 border-t">
                                  <span className="text-muted-foreground">音效清單：</span>
                                  <p className="mt-1">{version.script.soundEffects.join("、")}</p>
                                </div>
                              )}
                            </div>
                          </div>

                          <Separator />

                          {/* 結尾 CTA */}
                          <div>
                            <h3 className="font-semibold mb-3">結尾 CTA</h3>
                            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                              <p className="font-medium">{version.script.cta}</p>
                              {version.script.ctaTiming && (
                                <p className="text-xs text-muted-foreground mt-2">出現時機：{version.script.ctaTiming}</p>
                              )}
                            </div>
                          </div>

                          {/* 視覺風格建議 */}
                          {version.visualStyle && (
                            <>
                              <Separator />
                              <div>
                                <h3 className="font-semibold mb-3">視覺風格建議</h3>
                                <div className="grid gap-2 text-sm">
                                  {version.visualStyle.colorTone && (
                                    <div className="p-3 rounded bg-muted/30 flex justify-between">
                                      <span className="text-muted-foreground">色調</span>
                                      <span>{version.visualStyle.colorTone}</span>
                                    </div>
                                  )}
                                  {version.visualStyle.fontStyle && (
                                    <div className="p-3 rounded bg-muted/30 flex justify-between">
                                      <span className="text-muted-foreground">字型</span>
                                      <span>{version.visualStyle.fontStyle}</span>
                                    </div>
                                  )}
                                  {version.visualStyle.transitionStyle && (
                                    <div className="p-3 rounded bg-muted/30 flex justify-between">
                                      <span className="text-muted-foreground">轉場</span>
                                      <span>{version.visualStyle.transitionStyle}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </>
                          )}

                          {/* 備選 HOOK */}
                          {version.alternativeHooks && version.alternativeHooks.length > 0 && (
                            <>
                              <Separator />
                              <div>
                                <h3 className="font-semibold mb-3">備選 HOOK</h3>
                                <div className="space-y-2">
                                  {version.alternativeHooks.map((hook, i) => (
                                    <div key={i} className="p-3 rounded-lg border bg-muted/20 text-sm flex items-start gap-2">
                                      <span className="text-muted-foreground">{i + 1}.</span>
                                      <span>{hook}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* 側邊欄 */}
                  <div className="space-y-4">
                    {/* 拍攝建議 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">拍攝建議</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {version.shootingTips.map((tip, index) => (
                            <li key={index} className="flex items-start gap-2">
                              <span className="text-primary font-medium">{index + 1}.</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                        {version.locationSuggestion && (
                          <div className="mt-3 pt-3 border-t text-sm">
                            <span className="text-muted-foreground">場地：</span>
                            <span>{version.locationSuggestion}</span>
                          </div>
                        )}
                        {version.equipmentNeeded && version.equipmentNeeded.length > 0 && (
                          <div className="mt-2 text-sm">
                            <span className="text-muted-foreground">器材：</span>
                            <span>{version.equipmentNeeded.join("、")}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 剪輯建議 */}
                    {version.editingTips && version.editingTips.length > 0 && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">剪輯建議</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {version.editingTips.map((tip, index) => (
                              <li key={index} className="flex items-start gap-2">
                                <span className="text-primary font-medium">{index + 1}.</span>
                                <span>{tip}</span>
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* 預估表現 */}
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">預估表現</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                          <span className="text-muted-foreground">完播率</span>
                          <span className="font-medium">{version.estimatedMetrics.completionRate}</span>
                        </div>
                        <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                          <span className="text-muted-foreground">互動率</span>
                          <span className="font-medium">{version.estimatedMetrics.engagementRate}</span>
                        </div>
                        {version.estimatedMetrics.saveRate && (
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                            <span className="text-muted-foreground">收藏率</span>
                            <span>{version.estimatedMetrics.saveRate}</span>
                          </div>
                        )}
                        {version.estimatedMetrics.shareability && (
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                            <span className="text-muted-foreground">分享潛力</span>
                            <span>{version.estimatedMetrics.shareability}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                          <span className="text-muted-foreground">最佳發布</span>
                          <span>{version.estimatedMetrics.bestPostTime}</span>
                        </div>
                        {version.estimatedMetrics.bestPlatform && (
                          <div className="flex justify-between items-center p-2 rounded bg-primary/10 text-sm">
                            <span className="text-muted-foreground">最適平台</span>
                            <span className="font-medium text-primary">{version.estimatedMetrics.bestPlatform}</span>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* 注意事項 */}
                    {version.warnings && version.warnings.length > 0 && (
                      <Card className="border-orange-500/30">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base text-orange-600">注意事項</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2 text-sm">
                            {version.warnings.map((warning, index) => (
                              <li key={index} className="text-muted-foreground">
                                {warning}
                              </li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2">
                      <Button
                        className="flex-1"
                        onClick={() => copyToClipboard(formatScriptForCopy(version), version.id)}
                      >
                        {copiedId === version.id ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            已複製
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-2" />
                            複製全部
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadScript(version)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        下載
                      </Button>
                    </div>
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
