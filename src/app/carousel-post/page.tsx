"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  ExternalLink,
  Eye,
  Hash,
  Images,
  Lightbulb,
  MessageCircle,
  RefreshCw,
  Sparkles
} from "lucide-react"
import { useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"

interface CarouselSlide {
  page: number
  type: "cover" | "content" | "cta"
  headline: string
  subheadline?: string
  body?: string
  designTip?: string
}

interface QuizResult {
  result: string
  title: string
  description: string
}

interface CarouselPost {
  id: number
  title: string
  type: string
  description: string
  targetAudience: string
  slides: CarouselSlide[]
  caption: string
  hashtags: string[]
  estimatedEngagement: string
  quizResults?: QuizResult[]
}

const CAROUSEL_TYPES = [
  // 知識實用類
  { value: "knowledge", label: "知識乾貨型", description: "分享專業知識和技巧" },
  { value: "tutorial", label: "步驟教學型", description: "一步步教學流程" },
  { value: "list", label: "清單盤點型", description: "推薦清單或合集" },
  { value: "myth", label: "迷思破解型", description: "打破常見誤解" },
  { value: "comparison", label: "比較分析型", description: "優缺點比較" },
  { value: "tools", label: "工具推薦型", description: "實用工具資源" },
  { value: "summary", label: "懶人包型", description: "快速總結精華" },
  { value: "dodonot", label: "這樣做vs那樣做", description: "正確vs錯誤示範" },
  { value: "data", label: "數據圖解型", description: "視覺化數據分析" },
  // 生活情感類
  { value: "photodump", label: "生活碎片型", description: "日常隨拍記錄" },
  { value: "mood", label: "心情語錄型", description: "療癒文字分享" },
  { value: "memory", label: "回憶記錄型", description: "旅行/活動回顧" },
  { value: "story", label: "故事分享型", description: "個人經歷分享" },
  { value: "transformation", label: "蛻變對比型", description: "前後對比展示" },
  { value: "aesthetic", label: "美學靈感型", description: "視覺美感分享" },
  { value: "dayinlife", label: "一日生活型", description: "日常Vlog風格" },
  { value: "monthlyreview", label: "月度回顧型", description: "本月精選回顧" },
  // 互動趣味類
  { value: "quiz", label: "測驗互動型", description: "問答選擇題" },
  { value: "flowchart", label: "流程圖型", description: "滑動式決策" },
  { value: "meme", label: "迷因趣味型", description: "幽默共鳴內容" },
  { value: "challenge", label: "挑戰紀錄型", description: "30天挑戰等" },
]

const EXAMPLE_NICHES = [
  // 知識專業類
  "個人理財教學",
  "職場成長攻略",
  "健身減脂知識",
  "料理食譜分享",
  "旅遊攻略推薦",
  // 生活風格類
  "日常生活記錄",
  "心情語錄分享",
  "穿搭靈感日記",
  "居家佈置美學",
  "咖啡廳探店",
  // 興趣愛好類
  "攝影作品集",
  "手帳文具控",
  "追劇觀影心得",
  "寵物日常萌照",
]

export default function CarouselPostPage() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPosts, setGeneratedPosts] = useState<CarouselPost[]>([])
  const [selectedPost, setSelectedPost] = useState<CarouselPost | null>(null)
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0)
  const [creditError, setCreditError] = useState<string | null>(null)

  const { canUseFeature, useCredit, display } = useCredits()

  // 輸入狀態
  const [niche, setNiche] = useState("")
  const [targetAudience, setTargetAudience] = useState("")
  const [topic, setTopic] = useState("")
  const [carouselCount, setCarouselCount] = useState(10)

  const handleGenerate = async () => {
    if (!niche) {
      alert("請填寫你的領域/定位")
      return
    }

    // 檢查額度
    const creditCheck = canUseFeature('carousel')
    if (!creditCheck.canUse) {
      setCreditError(creditCheck.message || '額度不足')
      return
    }

    setCreditError(null)
    setIsGenerating(true)
    setGeneratedPosts([])

    try {
      const response = await fetch("/api/carousel-post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche,
          targetAudience,
          topic,
          carouselCount
        })
      })

      const data = await response.json()

      if (data.carouselPosts && data.carouselPosts.length > 0) {
        // 成功生成後扣除額度
        if (data._creditConsumed) {
          useCredit('carousel')
        }
        setGeneratedPosts(data.carouselPosts)
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

  const formatPostForCopy = (post: CarouselPost) => {
    let text = `【${post.title}】\n\n`
    text += `類型：${post.type}\n`
    text += `目標受眾：${post.targetAudience}\n\n`
    text += `═══════════════════════════════════\n`
    text += `輪播內容（共 ${post.slides.length} 頁）\n`
    text += `═══════════════════════════════════\n\n`

    post.slides.forEach((slide) => {
      text += `【第 ${slide.page} 頁 - ${slide.type === "cover" ? "封面" : slide.type === "cta" ? "CTA" : "內容"}】\n`
      text += `標題：${slide.headline}\n`
      if (slide.subheadline) text += `副標：${slide.subheadline}\n`
      if (slide.body) text += `內容：${slide.body}\n`
      if (slide.designTip) text += `設計建議：${slide.designTip}\n`
      text += `\n`
    })

    text += `═══════════════════════════════════\n`
    text += `貼文配文\n`
    text += `═══════════════════════════════════\n`
    text += `${post.caption}\n\n`

    text += `═══════════════════════════════════\n`
    text += `# Hashtags\n`
    text += `═══════════════════════════════════\n`
    text += post.hashtags.map(tag => `#${tag}`).join(" ") + "\n"

    return text
  }

  const SlidePreview = ({ slide, index, total }: { slide: CarouselSlide; index: number; total: number }) => {
    const bgColor = slide.type === "cover"
      ? "bg-gradient-to-br from-primary/20 to-purple-500/20"
      : slide.type === "cta"
        ? "bg-gradient-to-br from-green-500/20 to-emerald-500/20"
        : "bg-muted/50"

    return (
      <div className={`aspect-[4/5] rounded-lg border-2 ${bgColor} p-4 flex flex-col`}>
        <div className="flex justify-between items-center mb-2">
          <Badge variant={slide.type === "cover" ? "default" : slide.type === "cta" ? "success" : "secondary"}>
            {slide.type === "cover" ? "封面" : slide.type === "cta" ? "CTA" : `第 ${slide.page || index + 1} 頁`}
          </Badge>
          <span className="text-xs text-muted-foreground">{index + 1}/{total}</span>
        </div>

        <div className="flex-1 flex flex-col justify-center text-center space-y-2">
          <h3 className="font-bold text-lg leading-tight">{slide.headline}</h3>
          {slide.subheadline && (
            <p className="text-sm text-muted-foreground">{slide.subheadline}</p>
          )}
          {slide.body && (
            <p className="text-sm mt-2">{slide.body}</p>
          )}
        </div>

        {slide.designTip && (
          <div className="mt-auto pt-2 border-t">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium">設計提示：</span>{slide.designTip}
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Images className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            輪播貼文生成器
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            一次生成 {carouselCount} 組不同主題的輪播貼文
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              剩餘 {display.carousel}
            </span>
          </p>
        </div>
      </div>

      {/* 輸入區域 */}
      {generatedPosts.length === 0 && (
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="px-4 sm:px-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                設定你的輪播貼文
              </CardTitle>
              <CardDescription className="text-sm">
                填寫你的領域和受眾，AI 會為你生成多組不同主題的輪播貼文
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
              <div className="space-y-2">
                <Label className="flex items-center gap-1 text-sm">
                  你的領域/定位 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="例如：個人理財教學、職場成長、健身減脂..."
                  value={niche}
                  onChange={(e) => setNiche(e.target.value)}
                  className="h-10 sm:h-11"
                />
                <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-2">
                  {EXAMPLE_NICHES.map((example, i) => (
                    <Button
                      key={i}
                      variant="outline"
                      size="sm"
                      className="text-xs h-auto py-1 px-2 sm:px-3"
                      onClick={() => setNiche(example)}
                    >
                      <Lightbulb className="h-3 w-3 mr-1" />
                      {example}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>目標受眾</Label>
                <Textarea
                  placeholder="描述你的目標受眾（年齡、職業、困擾等）"
                  className="h-20 resize-none"
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label>特定主題方向（可選）</Label>
                <Input
                  placeholder="如果有特定想做的主題方向，可以在這裡填寫"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>生成數量</Label>
                  <Select
                    value={carouselCount.toString()}
                    onValueChange={(v) => setCarouselCount(parseInt(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5 組輪播貼文</SelectItem>
                      <SelectItem value="10">10 組輪播貼文（推薦）</SelectItem>
                      <SelectItem value="15">15 組輪播貼文</SelectItem>
                      <SelectItem value="20">20 組輪播貼文</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 額度不足提示 */}
              {creditError && (
                <CreditsAlert message={creditError} featureType="carousel" />
              )}

              <Button
                onClick={handleGenerate}
                disabled={!niche || isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                    AI 正在生成 {carouselCount} 組輪播貼文...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    生成 {carouselCount} 組輪播貼文
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 右側說明 */}
          <Card className="h-fit">
            <CardHeader className="px-4 sm:px-6 pb-2 sm:pb-4">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Lightbulb className="h-4 w-4 sm:h-5 sm:w-5 text-amber-500" />
                什麼是輪播貼文？
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4 text-sm px-4 sm:px-6">
              <p className="text-muted-foreground text-xs sm:text-sm">
                輪播貼文是 IG/小紅書 上超受歡迎的內容形式，用戶可以左右滑動查看多頁內容。
              </p>

              <div className="space-y-2">
                <p className="font-medium text-sm">為什麼要用輪播貼文？</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 text-xs sm:text-sm">
                  <li>停留時間長，演算法愛推</li>
                  <li>資訊量大，價值感高</li>
                  <li>收藏率高，容易爆款</li>
                  <li>適合知識類內容</li>
                </ul>
              </div>

              <Separator />

              <div className="space-y-2">
                <p className="font-medium text-sm">2025 熱門輪播類型</p>
                <div className="space-y-2 text-xs">
                  <div>
                    <p className="text-muted-foreground mb-1">知識實用</p>
                    <div className="flex flex-wrap gap-1">
                      {CAROUSEL_TYPES.slice(0, 5).map((type) => (
                        <Badge key={type.value} variant="outline" className="text-xs">
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">生活情感</p>
                    <div className="flex flex-wrap gap-1">
                      {CAROUSEL_TYPES.slice(9, 14).map((type) => (
                        <Badge key={type.value} variant="outline" className="text-xs">
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground mb-1">互動趣味</p>
                    <div className="flex flex-wrap gap-1">
                      {CAROUSEL_TYPES.slice(18, 22).map((type) => (
                        <Badge key={type.value} variant="outline" className="text-xs">
                          {type.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <p className="font-medium text-sm">Canva 製作教學</p>
                <div className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                  <p className="font-medium text-foreground">步驟一：建立設計</p>
                  <p>開啟 Canva → 搜尋「Instagram 貼文」→ 選擇 1080x1350 尺寸（最佳比例 4:5）</p>

                  <p className="font-medium text-foreground pt-1">步驟二：設計封面</p>
                  <p>選擇醒目模板 → 輸入標題文字 → 使用對比色背景吸引目光</p>

                  <p className="font-medium text-foreground pt-1">步驟三：製作內容頁</p>
                  <p>複製封面 → 修改內容 → 保持統一視覺風格</p>

                  <p className="font-medium text-foreground pt-1">步驟四：匯出發布</p>
                  <p>下載為 PNG → 按順序上傳至 IG/小紅書</p>
                </div>

                <div className="pt-2 space-y-2">
                  <a
                    href="https://www.canva.com/create/instagram-posts/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="outline" className="w-full text-xs sm:text-sm" size="sm">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      用 Canva 製作 IG 貼文
                    </Button>
                  </a>
                  <a
                    href="https://www.canva.com/templates/?query=carousel"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <Button variant="ghost" className="w-full text-xs sm:text-sm" size="sm">
                      <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                      瀏覽輪播貼文模板
                    </Button>
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 生成結果 */}
      {generatedPosts.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold">
                已生成 {generatedPosts.length} 組輪播貼文
              </h2>
              <p className="text-muted-foreground text-xs sm:text-sm">
                點擊任意貼文查看完整內容，或直接複製使用
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => setGeneratedPosts([])}
              className="w-full sm:w-auto"
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              重新生成
            </Button>
          </div>

          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {generatedPosts.map((post, index) => (
              <Card
                key={post.id || index}
                className="cursor-pointer hover:border-primary/50 transition-colors"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {post.type}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {post.slides?.length || 0} 頁
                    </span>
                  </div>
                  <CardTitle className="text-base line-clamp-2 mt-2">
                    {post.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {post.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {post.hashtags?.slice(0, 3).map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        #{tag}
                      </Badge>
                    ))}
                    {post.hashtags?.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{post.hashtags.length - 3}
                      </Badge>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            setSelectedPost(post)
                            setCurrentSlideIndex(0)
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          預覽
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-lg sm:max-w-2xl max-h-[85vh] overflow-y-auto p-4 sm:p-6">
                        <DialogHeader>
                          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
                            <Images className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                            <span className="line-clamp-1">{post.title}</span>
                          </DialogTitle>
                          <DialogDescription className="text-xs sm:text-sm">
                            {post.type} · {post.slides?.length || 0} 頁
                          </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4 mt-3">
                          {/* 輪播預覽 - 縮小尺寸 */}
                          <div className="space-y-3">
                            <div className="relative max-w-[280px] sm:max-w-[320px] mx-auto">
                              {post.slides && post.slides.length > 0 && (
                                <SlidePreview
                                  slide={post.slides[currentSlideIndex]}
                                  index={currentSlideIndex}
                                  total={post.slides.length}
                                />
                              )}

                              {/* 導航按鈕 */}
                              <div className="absolute inset-y-0 left-0 flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-background/80"
                                  onClick={() => setCurrentSlideIndex(Math.max(0, currentSlideIndex - 1))}
                                  disabled={currentSlideIndex === 0}
                                >
                                  <ChevronLeft className="h-4 w-4" />
                                </Button>
                              </div>
                              <div className="absolute inset-y-0 right-0 flex items-center">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 rounded-full bg-background/80"
                                  onClick={() => setCurrentSlideIndex(Math.min((post.slides?.length || 1) - 1, currentSlideIndex + 1))}
                                  disabled={currentSlideIndex === (post.slides?.length || 1) - 1}
                                >
                                  <ChevronRight className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            {/* 頁面指示器 */}
                            <div className="flex justify-center gap-1">
                              {post.slides?.map((_, i) => (
                                <button
                                  key={i}
                                  className={`h-2 rounded-full transition-all ${
                                    i === currentSlideIndex
                                      ? "w-6 bg-primary"
                                      : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                                  }`}
                                  onClick={() => setCurrentSlideIndex(i)}
                                />
                              ))}
                            </div>
                          </div>

                          {/* 配文和 Hashtags */}
                          <div className="space-y-3">
                            <div>
                              <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                <Hash className="h-4 w-4 text-primary" />
                                貼文配文
                              </h4>
                              <div className="p-2.5 sm:p-3 rounded-lg bg-muted/50 text-xs sm:text-sm whitespace-pre-wrap max-h-[120px] overflow-y-auto">
                                {post.caption}
                              </div>
                            </div>

                            <Separator />

                            <div>
                              <h4 className="font-medium mb-2 text-sm">Hashtags</h4>
                              <div className="flex flex-wrap gap-1">
                                {post.hashtags?.map((tag, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="cursor-pointer hover:bg-primary hover:text-primary-foreground text-xs"
                                    onClick={() => copyToClipboard(`#${tag}`)}
                                  >
                                    #{tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>

                            {/* 測驗結果區域 - 只有測驗類貼文才顯示 */}
                            {post.quizResults && post.quizResults.length > 0 && (
                              <>
                                <Separator />
                                <div>
                                  <h4 className="font-medium mb-2 flex items-center gap-2 text-sm">
                                    <MessageCircle className="h-4 w-4 text-primary" />
                                    測驗結果回覆
                                  </h4>
                                  <div className="space-y-2 max-h-[150px] overflow-y-auto">
                                    {post.quizResults.map((quizResult, i) => (
                                      <div
                                        key={i}
                                        className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 cursor-pointer transition-colors group"
                                        onClick={() => copyToClipboard(`${quizResult.title}\n${quizResult.description}`)}
                                      >
                                        <div className="flex items-start justify-between gap-2">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                              <Badge variant="outline" className="text-xs flex-shrink-0">
                                                {quizResult.result}
                                              </Badge>
                                              <span className="font-medium text-xs truncate">
                                                {quizResult.title}
                                              </span>
                                            </div>
                                            <p className="text-xs text-muted-foreground line-clamp-2">
                                              {quizResult.description}
                                            </p>
                                          </div>
                                          <Copy className="h-3 w-3 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </>
                            )}

                            <Separator />

                            <div className="flex gap-2">
                              <Button
                                className="flex-1"
                                size="sm"
                                onClick={() => copyToClipboard(formatPostForCopy(post))}
                              >
                                <Copy className="h-4 w-4 mr-2" />
                                複製全部
                              </Button>
                              <Button variant="outline" size="sm">
                                <Download className="h-4 w-4 mr-2" />
                                下載
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(formatPostForCopy(post))}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
