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
  Video,
  MessageCircle
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
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
const TIER_SCRIPT_LIMITS: Record<string, number> = {
  free: 1,      // 免費版固定 1 個
  creator: 2,   // 創作者 2 個
  pro: 3,       // 專業版 3 個
  lifetime: 3,  // 終身版 3 個
}

function ScriptGeneratorContent() {
  const searchParams = useSearchParams()
  const [step, setStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedVersions, setGeneratedVersions] = useState<ScriptVersion[]>([])
  const [activeVersion, setActiveVersion] = useState("A")
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<"simple" | "professional">("simple") // 檢視模式
  const [isAnalyzing, setIsAnalyzing] = useState(false) // 細節分析中
  const [preAnalysis, setPreAnalysis] = useState<{
    analysis: string
    questions: { id: string; question: string; placeholder: string; why: string; suggestions?: string[] }[]
  } | null>(null)
  const [preAnalysisAnswers, setPreAnalysisAnswers] = useState<Record<string, string>>({})
  const [selectedPositioningId, setSelectedPositioningId] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [positioningData, setPositioningData] = useState<Record<string, any> | null>(null) // 完整定位報告

  const { canUseFeature, useCredit, display, credits, isLoading: creditsLoading } = useCredits()

  // 根據訂閱等級決定可生成的版本數（等 credits 載入後才能確定）
  const tier = credits?.tier || 'free'
  const maxVersions = creditsLoading ? 3 : (TIER_SCRIPT_LIMITS[tier] || 1) // 載入中時預設顯示最高值，避免誤導
  const [generateCount, setGenerateCount] = useState(1) // 預設值，會在 useEffect 中更新

  // 當 credits 載入後，更新 generateCount 為該方案的上限
  useEffect(() => {
    if (credits?.tier) {
      const limit = TIER_SCRIPT_LIMITS[credits.tier] || 3
      setGenerateCount(limit)
      // 清除「載入中」的錯誤訊息
      if (creditError === '載入中...') {
        setCreditError(null)
      }
    }
  }, [credits?.tier, creditError])

  // 從 URL 參數載入定位 ID
  useEffect(() => {
    const positioningId = searchParams.get('positioning')
    if (positioningId) {
      setSelectedPositioningId(positioningId)
      // 載入定位資料
      loadPositioningData(positioningId)
    }
  }, [searchParams])

  // 從選題靈感頁面載入選題資料
  useEffect(() => {
    const fromTopic = searchParams.get('from') === 'topic'
    if (fromTopic) {
      const topicData = sessionStorage.getItem('topic_idea')
      if (topicData) {
        try {
          const topic = JSON.parse(topicData)
          // 自動填入 step1 的領域和受眾
          if (topic.niche || topic.targetAudience) {
            setCreatorBackground(prev => ({
              ...prev,
              niche: topic.niche || prev.niche,
              targetAudience: topic.targetAudience || prev.targetAudience,
            }))
          }
          // 自動填入 step2 的影片主題和建議開頭
          setVideoSettings(prev => ({
            ...prev,
            topic: topic.description || topic.title || '',  // 用描述或標題作為主題引導
            keyMessage: topic.hookSuggestion || '',         // 建議開頭放到核心訊息
          }))
          // 清除 sessionStorage
          sessionStorage.removeItem('topic_idea')
          // 自動跳到 step2
          setStep(2)
        } catch (e) {
          console.error('Failed to parse topic data:', e)
        }
      }
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
          // 調用 handlePositioningSelect，它會自動保存完整報告
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
            personaTags: record.output_data.personaTags || [],
            fullReport: record.output_data // 傳遞完整的定位報告
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

      // 從定位報告中提取個人經歷
      let expertiseText = positioning.expertise || ''
      if (positioning.fullReport) {
        const report = positioning.fullReport
        const parts: string[] = []
        if (report.storyAssets?.workExperience) parts.push(report.storyAssets.workExperience)
        if (report.storyAssets?.education) parts.push(report.storyAssets.education)
        if (report.storyAssets?.otherExperience) parts.push(report.storyAssets.otherExperience)
        if (report.backgroundStoryAnalysis?.summary) parts.push(report.backgroundStoryAnalysis.summary)
        if (parts.length > 0) {
          expertiseText = parts.join('\n')
        }
      }

      setCreatorBackground({
        ...creatorBackground,
        niche: positioning.niche,
        expertise: expertiseText,
        targetAudience: positioning.targetAudience,
        audiencePainPoints: positioning.audiencePainPoints,
        contentStyle: positioning.contentStyle,
        platforms: positioning.platforms
      })
      // 如果有完整的定位報告，保存起來給 API 使用
      if (positioning.fullReport) {
        setPositioningData(positioning.fullReport)
      }
    } else {
      setSelectedPositioningId(null)
      setPositioningData(null)
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
    castCount: "",
    // 藏鏡人專用
    valuePoints: "",     // 核心知識/價值點
    storyToShare: "",    // 出鏡者要分享的故事
    keyTakeaway: "",     // 觀眾該學到什麼
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

  // Step 2 → Step 3：呼叫 pre-analysis API 產生細節問題
  const handlePreAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch("/api/script-pre-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creatorBackground, videoSettings, positioningData: positioningData || undefined })
      })

      if (response.ok) {
        const data = await response.json()
        setPreAnalysis(data)
        setPreAnalysisAnswers({}) // 重置答案
        setStep(3)
      } else {
        // 如果 pre-analysis 失敗，用預設問題繼續
        setPreAnalysis({
          analysis: "讓我根據你的設定來幫你優化腳本。先回答幾個問題，讓腳本更有料！",
          questions: [
            { id: "q1", question: "關於這個主題，你有什麼真實的故事或經歷可以分享？", placeholder: "例如：我曾經因為XXX虧了50萬...", why: "真實故事讓腳本更吸引人", suggestions: ["剛入行的時候踩了很多坑，花了不少冤枉錢才學到教訓", "有一次遇到很大的挫折，差點想放棄，後來靠一個方法撐過來了"] },
            { id: "q2", question: "你想讓觀眾看完之後記住什麼重點？", placeholder: "例如：投資最重要的是風險控管", why: "有明確重點的影片完播率更高", suggestions: ["至少知道一個馬上可以用的方法", "改變一個錯誤的觀念或習慣"] },
            { id: "q3", question: "關於這個主題，一般人最容易犯的錯或最大的誤解是什麼？", placeholder: "例如：大家都以為要很多錢才能開始...", why: "打破迷思能製造懸念", suggestions: ["大部分人以為很難，其實掌握關鍵就不難", "很多人做錯了第一步，後面全部白費"] },
          ]
        })
        setPreAnalysisAnswers({})
        setStep(3)
      }
    } catch {
      // 網路錯誤也用預設問題
      setPreAnalysis({
        analysis: "讓我根據你的設定來幫你優化腳本。先回答幾個問題！",
        questions: [
          { id: "q1", question: "關於這個主題，你有什麼真實的故事或經歷可以分享？", placeholder: "例如：我曾經因為XXX虧了50萬...", why: "真實故事讓腳本更吸引人", suggestions: ["剛入行的時候踩了很多坑，花了不少冤枉錢才學到教訓", "有一次遇到很大的挫折，差點想放棄，後來靠一個方法撐過來了"] },
          { id: "q2", question: "你想讓觀眾看完之後記住什麼重點？", placeholder: "例如：投資最重要的是風險控管", why: "有明確重點的影片完播率更高", suggestions: ["至少知道一個馬上可以用的方法", "改變一個錯誤的觀念或習慣"] },
          { id: "q3", question: "關於這個主題，一般人最容易犯的錯是什麼？", placeholder: "例如：大家都以為要很多錢才能開始...", why: "打破迷思能製造懸念", suggestions: ["大部分人以為很難，其實掌握關鍵就不難", "很多人做錯了第一步，後面全部白費"] },
        ]
      })
      setPreAnalysisAnswers({})
      setStep(3)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerate = async () => {
    // 如果 credits 還在載入，等待一下
    if (creditsLoading) {
      setCreditError('額度資料載入中，請稍候再試')
      return
    }

    // 檢查額度
    const creditCheck = canUseFeature('script')
    if (!creditCheck.canUse && creditCheck.message !== '載入中...') {
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
          generateVersions: generateCount,
          positioningData: positioningData || undefined,
          // Step 3 的細節問答（如果有的話）
          preAnalysisAnswers: Object.keys(preAnalysisAnswers).length > 0 ? preAnalysisAnswers : undefined,
          preAnalysisQuestions: preAnalysis?.questions || undefined
        })
      })

      // 處理 HTTP 錯誤
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        const errorMsg = errorData.error || `伺服器錯誤 (${response.status})`

        if (response.status === 504 || response.status === 408) {
          alert("生成超時，請稍後再試。\n\n提示：可以嘗試減少生成版本數量")
        } else if (response.status === 401) {
          alert("登入狀態已過期，請重新登入")
        } else if (response.status === 429) {
          alert("請求太頻繁，請稍後再試")
        } else {
          alert(`生成失敗：${errorMsg}`)
        }
        return
      }

      // 處理 SSE streaming 回應
      const reader = response.body?.getReader()
      if (!reader) {
        alert("生成失敗：無法讀取回應")
        return
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        // 解析 SSE 事件
        const events = buffer.split('\n\n')
        buffer = events.pop() || '' // 保留不完整的事件

        for (const event of events) {
          if (!event.startsWith('data: ')) continue
          try {
            const data = JSON.parse(event.slice(6))

            if (data.type === 'done') {
              // 收到完整結果
              if (data.result?.versions?.length > 0) {
                if (data._creditConsumed) {
                  useCredit('script')
                }
                setGeneratedVersions(data.result.versions)
                setActiveVersion(data.result.versions[0].id)
                setStep(4)
              } else if (data.result?.error) {
                alert(`生成失敗：${data.result.error}`)
              } else {
                alert("生成失敗，請稍後再試")
              }
            } else if (data.type === 'error') {
              alert(`生成失敗：${data.error}`)
            }
            // type === 'chunk' 不需要特別處理，只是保持連線活躍
          } catch {
            // 忽略解析失敗的事件
          }
        }
      }
    } catch (error) {
      console.error("Error:", error)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        alert("網路連線失敗，請檢查網路狀態")
      } else {
        alert("發生錯誤，請稍後再試")
      }
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

    if (version.estimatedMetrics) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  預估表現\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      text += `完播率：${version.estimatedMetrics.completionRate || '—'}\n`
      text += `互動率：${version.estimatedMetrics.engagementRate || '—'}\n`
      if (version.estimatedMetrics.saveRate) text += `收藏率：${version.estimatedMetrics.saveRate}\n`
      if (version.estimatedMetrics.shareability) text += `分享潛力：${version.estimatedMetrics.shareability}\n`
      text += `最佳發布：${version.estimatedMetrics.bestPostTime || '—'}\n`
      if (version.estimatedMetrics.bestPlatform) text += `最適平台：${version.estimatedMetrics.bestPlatform}\n`
    }

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

  const progress = step === 1 ? 25 : step === 2 ? 50 : step === 3 ? 75 : 100

  return (
    <div className="flex flex-col gap-3 sm:gap-6 overflow-hidden">
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
            { num: 3, label: "細節", labelFull: "內容細節", icon: MessageCircle },
            { num: 4, label: "結果", labelFull: "生成結果", icon: Sparkles },
          ].map((item, index) => (
            <div key={item.num} className="flex items-center flex-1 justify-center sm:justify-start sm:flex-initial">
              <div className={`flex flex-col sm:flex-row items-center gap-1 sm:gap-2 ${step >= item.num ? "text-primary" : "text-muted-foreground"}`}>
                <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-bold ${
                  step > item.num
                    ? "bg-primary text-primary-foreground"
                    : step === item.num
                      ? "bg-primary/20 text-primary border-2 border-primary"
                      : "bg-muted text-muted-foreground"
                }`}>
                  {step > item.num ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> : item.num}
                </div>
                <span className="text-[10px] sm:text-sm font-medium sm:hidden">{item.label}</span>
                <span className="hidden sm:block text-sm font-medium">{item.labelFull}</span>
              </div>
              {index < 3 && (
                <div className={`hidden sm:block w-4 md:w-8 lg:w-16 h-0.5 mx-1 sm:mx-2 ${
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
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-w-0 overflow-hidden">
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <User className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Step 1：創作者背景
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                填寫你的領域和目標受眾，AI 會根據這些資訊生成更精準的腳本
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
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
                {selectedPositioningId && positioningData && (
                  <div className="p-2.5 sm:p-3 rounded-lg bg-primary/5 border border-primary/20 space-y-1.5 sm:space-y-2 overflow-hidden">
                    <p className="text-[10px] sm:text-xs font-medium text-primary">✓ 已載入完整定位報告，AI 會參考以下內容生成腳本：</p>
                    <div className="text-[10px] sm:text-xs text-muted-foreground space-y-1 break-words overflow-hidden">
                      {positioningData.positioningStatement && (
                        <p className="line-clamp-2 sm:line-clamp-none"><span className="font-medium">定位宣言：</span>{positioningData.positioningStatement}</p>
                      )}
                      {positioningData.persona?.coreIdentity && (
                        <p className="line-clamp-1 sm:line-clamp-none"><span className="font-medium">人設定位：</span>{positioningData.persona.coreIdentity}</p>
                      )}
                      {positioningData.targetAudience?.who && (
                        <p className="line-clamp-1 sm:line-clamp-none"><span className="font-medium">目標受眾：</span>{positioningData.targetAudience.who}</p>
                      )}
                      {positioningData.backgroundStoryAnalysis?.summary && (
                        <p className="line-clamp-2 sm:line-clamp-none"><span className="font-medium">背景故事摘要：</span>{positioningData.backgroundStoryAnalysis.summary}</p>
                      )}
                      {positioningData.contentPillars && positioningData.contentPillars.length > 0 && (
                        <p className="line-clamp-1 sm:line-clamp-none"><span className="font-medium">內容支柱：</span>{positioningData.contentPillars.map((p: {pillar: string}) => p.pillar).join('、')}</p>
                      )}
                      {positioningData.personaTags && positioningData.personaTags.length > 0 && (
                        <p className="line-clamp-1 sm:line-clamp-none"><span className="font-medium">人設標籤：</span>{positioningData.personaTags.join('、')}</p>
                      )}
                    </div>
                    <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-400 mt-1.5 sm:mt-2 border-t border-primary/10 pt-1.5 sm:pt-2">
                      ⚠️ 請確認上方背景故事是否正確！
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-medium">
                  你的領域 / 定位 <span className="text-destructive">*</span>
                </Label>
                <Input
                  placeholder="例如：個人理財教學、職場成長、健身減脂..."
                  value={creatorBackground.niche}
                  onChange={(e) => setCreatorBackground({ ...creatorBackground, niche: e.target.value })}
                  className="h-9 sm:h-11 text-sm"
                />
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {EXAMPLE_NICHES.map((item) => (
                    <Button
                      key={item}
                      variant={creatorBackground.niche === item ? "default" : "outline"}
                      size="sm"
                      className="text-xs h-7 sm:h-8 px-2 sm:px-3"
                      onClick={() => setCreatorBackground({ ...creatorBackground, niche: item })}
                    >
                      {item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-medium">
                  目標受眾 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="描述你的目標觀眾，例如：25-35歲上班族，想學投資但不知道從何開始..."
                  className="min-h-[80px] sm:min-h-[100px] resize-none text-sm"
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
                      <Label>專業背景 / 個人經歷（會用在腳本裡！）</Label>
                      <Textarea
                        placeholder="填寫你的真實經歷，AI 會根據這些內容來寫腳本。例如：&#10;• 亂投資虧了 50 萬，後來學會正確理財&#10;• 從月薪 3 萬到年薪百萬的過程&#10;• 創業第一年差點倒閉的故事"
                        className="h-24 resize-none"
                        value={creatorBackground.expertise}
                        onChange={(e) => setCreatorBackground({ ...creatorBackground, expertise: e.target.value })}
                      />
                      <p className="text-xs text-muted-foreground">
                        越具體越好！AI 會使用你提供的數字、經歷來寫腳本
                      </p>
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

              <div className="flex justify-end pt-3 sm:pt-4">
                <Button
                  onClick={() => setStep(2)}
                  disabled={!canProceedStep1}
                  className="px-6 sm:px-8 h-9 sm:h-10 text-sm"
                >
                  下一步
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit hidden lg:block">
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
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-w-0 overflow-hidden">
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Step 2：影片設定
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                設定這支影片的主題、目標和拍攝方式
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
              <div className="space-y-2 sm:space-y-3">
                <Label className="text-xs sm:text-sm font-medium">
                  影片主題 <span className="text-destructive">*</span>
                </Label>
                <Textarea
                  placeholder="描述這支影片要講什麼內容、想傳達什麼？&#10;不需要想標題，只要描述主題方向即可，AI 會幫你生成爆款標題"
                  value={videoSettings.topic}
                  onChange={(e) => setVideoSettings({ ...videoSettings, topic: e.target.value })}
                  className="h-16 sm:h-20 resize-none text-sm"
                />
                <p className="text-[10px] sm:text-xs text-muted-foreground">
                  {positioningData ? '根據你的定位推薦以下主題，點擊即可使用：' : '不知道要拍什麼？點擊以下範例：'}
                </p>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {(() => {
                    // 如果有定位資料，從中提取主題建議
                    if (positioningData) {
                      const suggestions: string[] = []
                      // 從前10支影片建議提取
                      if (positioningData.first10Videos) {
                        positioningData.first10Videos.forEach((v: { title?: string }) => {
                          if (v.title) suggestions.push(v.title)
                        })
                      }
                      // 如果影片建議不足，從內容支柱的 topics 補充
                      if (suggestions.length < 4 && positioningData.contentPillars) {
                        positioningData.contentPillars.forEach((p: { topics?: string[] }) => {
                          p.topics?.forEach(t => {
                            if (suggestions.length < 8 && !suggestions.includes(t)) suggestions.push(t)
                          })
                        })
                      }
                      return suggestions.slice(0, 8)
                    }
                    return EXAMPLE_TOPICS
                  })().map((item) => (
                    <Button
                      key={item}
                      variant="outline"
                      size="sm"
                      className="text-[10px] sm:text-xs h-auto py-1 sm:py-1.5 px-2 sm:px-3 whitespace-normal text-left max-w-full break-words"
                      onClick={() => setVideoSettings({ ...videoSettings, topic: item })}
                    >
                      {item.length > 20 ? item.slice(0, 20) + '...' : item}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">
                    影片目標 <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={videoSettings.goal}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, goal: v })}
                  >
                    <SelectTrigger className="h-9 sm:h-11 text-sm">
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

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    拍攝方式
                  </Label>
                  <Select
                    value={videoSettings.shootingType}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, shootingType: v })}
                  >
                    <SelectTrigger className="h-9 sm:h-11 text-sm">
                      <SelectValue placeholder="選擇拍攝方式" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="talking_head">口播型 - 對著鏡頭說話</SelectItem>
                      <SelectItem value="behind_camera">藏鏡人 - 一人掌鏡提問，一人出鏡回答</SelectItem>
                      <SelectItem value="voiceover">純配音 - 只有聲音旁白配畫面</SelectItem>
                      <SelectItem value="acting">演戲型 - 有劇情有對話</SelectItem>
                      <SelectItem value="vlog">Vlog - 生活記錄風格</SelectItem>
                      <SelectItem value="tutorial">教學型 - 邊做邊說</SelectItem>
                      <SelectItem value="interview">訪談型 - 對談聊天</SelectItem>
                      <SelectItem value="storytime">說故事 - 敘事型內容</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* 價值輸出設定 — 所有拍攝類型都適用 */}
              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-amber-700 dark:text-amber-400">
                  <Lightbulb className="h-4 w-4" />
                  內容設計（填越多，腳本越有料！）
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">
                    這支影片要傳達的核心知識/價值
                  </Label>
                  <Textarea
                    placeholder={"影片中要傳達什麼有價值的內容？\n例如：\n• 開店第一年虧了 50 萬，後來靠調整菜單翻身\n• 正確的投資心態：不要追高殺低\n• 三個新手最容易犯的錯"}
                    value={videoSettings.valuePoints}
                    onChange={(e) => setVideoSettings({ ...videoSettings, valuePoints: e.target.value })}
                    className="h-20 sm:h-24 resize-none text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">
                    要帶入的故事/經歷（有故事才有吸引力！）
                  </Label>
                  <Textarea
                    placeholder={"有什麼真實故事可以帶入影片？\n例如：\n• 創業初期被客戶放鴿子，差點撐不下去\n• 第一次帶團被投訴，結果後來成了最受歡迎的導遊\n• 從月薪三萬到年收百萬的轉折點"}
                    value={videoSettings.storyToShare}
                    onChange={(e) => setVideoSettings({ ...videoSettings, storyToShare: e.target.value })}
                    className="h-20 sm:h-24 resize-none text-sm"
                  />
                </div>

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">
                    觀眾看完應該學到/記住什麼？
                  </Label>
                  <Textarea
                    placeholder={"觀眾看完影片後，最該帶走的重點是什麼？\n例如：\n• 投資不是賭博，要先學會控制風險\n• 做餐飲最重要的是食材，不是裝潢\n• 創業前先存六個月的生活費"}
                    value={videoSettings.keyTakeaway}
                    onChange={(e) => setVideoSettings({ ...videoSettings, keyTakeaway: e.target.value })}
                    className="h-16 sm:h-20 resize-none text-sm"
                  />
                </div>

                <p className="text-[10px] sm:text-xs text-amber-600 dark:text-amber-500">
                  以上欄位不是必填，但填了會讓腳本更有深度！AI 會根據你提供的內容來設計腳本。
                </p>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    演員人數
                  </Label>
                  <Select
                    value={videoSettings.castCount}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, castCount: v })}
                  >
                    <SelectTrigger className="h-9 sm:h-11 text-sm">
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

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">影片氛圍</Label>
                  <Select
                    value={videoSettings.emotionalTone}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, emotionalTone: v })}
                  >
                    <SelectTrigger className="h-9 sm:h-11 text-sm">
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

              <div className="space-y-3 sm:space-y-4 p-3 sm:p-4 bg-muted/30 rounded-lg">
                <div className="flex items-center justify-between gap-2">
                  <Label className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    影片長度：{videoSettings.duration} 秒
                  </Label>
                  <Badge variant={
                    videoSettings.duration <= 30 ? "default" :
                    videoSettings.duration <= 60 ? "secondary" : "outline"
                  } className="text-[10px] sm:text-xs shrink-0">
                    {videoSettings.duration <= 30 ? "極短 / 高完播" :
                     videoSettings.duration <= 60 ? "標準 / 最常見" :
                     videoSettings.duration <= 90 ? "中長 / 教學適合" : "長片 / 深度內容（上限）"}
                  </Badge>
                </div>
                <Slider
                  value={[videoSettings.duration]}
                  onValueChange={(v) => setVideoSettings({ ...videoSettings, duration: v[0] })}
                  min={15}
                  max={120}
                  step={5}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>15秒</span>
                  <span>45秒</span>
                  <span>60秒</span>
                  <span>120秒</span>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4 grid-cols-1 md:grid-cols-2">
                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="text-xs sm:text-sm">結尾 CTA</Label>
                  <Select
                    value={videoSettings.cta}
                    onValueChange={(v) => setVideoSettings({ ...videoSettings, cta: v })}
                  >
                    <SelectTrigger className="h-9 sm:h-11 text-sm">
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

                <div className="space-y-1.5 sm:space-y-2">
                  <Label className="flex items-center gap-2 text-xs sm:text-sm">
                    生成版本數
                    {!creditsLoading && maxVersions < 5 && (
                      <Badge variant="outline" className="text-[10px] sm:text-xs font-normal">
                        上限 {maxVersions} 個
                      </Badge>
                    )}
                  </Label>
                  {creditsLoading ? (
                    // 載入中
                    <div className="h-11 px-3 border rounded-md flex items-center justify-center bg-muted/50">
                      <span className="text-sm text-muted-foreground">載入中...</span>
                    </div>
                  ) : maxVersions <= 2 ? (
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
                        <SelectItem value="1">1 個版本</SelectItem>
                        {maxVersions >= 2 && <SelectItem value="2">2 個版本{maxVersions === 2 ? '（上限）' : ''}</SelectItem>}
                        {maxVersions >= 3 && <SelectItem value="3">3 個版本（推薦）{maxVersions === 3 ? '' : ''}</SelectItem>}
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label className="text-xs sm:text-sm">特殊需求（選填）</Label>
                <Textarea
                  placeholder="例如：想要搞笑風格、需要包含特定關鍵字..."
                  className="h-16 sm:h-20 resize-none text-sm"
                  value={videoSettings.specialRequirements}
                  onChange={(e) => setVideoSettings({ ...videoSettings, specialRequirements: e.target.value })}
                />
              </div>

              {/* 額度不足提示 - 載入中時不顯示錯誤，避免誤導 */}
              {creditError && !creditsLoading && creditError !== '載入中...' && (
                <CreditsAlert message={creditError} featureType="script" />
              )}

              <div className="flex justify-between pt-3 sm:pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="h-9 sm:h-10 text-sm">
                  <ArrowLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                  上一步
                </Button>
                <Button
                  onClick={handlePreAnalysis}
                  disabled={!canProceedStep2 || isAnalyzing}
                  className="px-6 sm:px-8 h-9 sm:h-10 text-sm"
                >
                  {isAnalyzing ? (
                    <>
                      <RefreshCw className="mr-1.5 sm:mr-2 h-4 w-4 animate-spin" />
                      分析中...
                    </>
                  ) : (
                    <>
                      下一步
                      <ArrowRight className="h-4 w-4 ml-1.5 sm:ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="h-fit hidden lg:block">
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

      {/* Step 3 - 細節問答 */}
      {step === 3 && preAnalysis && (
        <div className="grid gap-3 sm:gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 min-w-0 overflow-hidden">
            <CardHeader className="px-3 py-3 sm:px-6 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Step 3：內容細節
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                回答以下問題讓 AI 生成更有價值的腳本（可以跳過不填）
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 sm:space-y-6 px-3 sm:px-6">
              {/* 微分析 */}
              <div className="p-3 sm:p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <Sparkles className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-sm sm:text-base leading-relaxed">{preAnalysis.analysis}</p>
                </div>
              </div>

              {/* 問題列表 */}
              <div className="space-y-4 sm:space-y-5">
                {preAnalysis.questions.map((q, index) => (
                  <div key={q.id} className="space-y-1.5 sm:space-y-2">
                    <Label className="text-xs sm:text-sm font-medium flex items-start gap-2">
                      <span className="bg-primary/10 text-primary text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        {index + 1}
                      </span>
                      <span>{q.question}</span>
                    </Label>
                    <Textarea
                      placeholder={q.placeholder}
                      value={preAnalysisAnswers[q.id] || ''}
                      onChange={(e) => setPreAnalysisAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                      className="h-20 sm:h-24 resize-none text-sm"
                    />
                    {q.suggestions && q.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 sm:gap-2 pl-7">
                        {q.suggestions.map((suggestion, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => setPreAnalysisAnswers(prev => ({ ...prev, [q.id]: suggestion }))}
                            className={`text-left text-[11px] sm:text-xs px-2.5 py-1.5 rounded-full border transition-colors ${
                              preAnalysisAnswers[q.id] === suggestion
                                ? 'bg-primary/10 border-primary/40 text-primary'
                                : 'bg-muted/50 border-border hover:bg-muted hover:border-primary/30'
                            }`}
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    )}
                    <p className="text-[10px] sm:text-xs text-muted-foreground pl-7">
                      {q.why}
                    </p>
                  </div>
                ))}
              </div>

              {/* 額度不足提示 */}
              {creditError && !creditsLoading && creditError !== '載入中...' && (
                <CreditsAlert message={creditError} featureType="script" />
              )}

              <div className="flex justify-between pt-3 sm:pt-4">
                <Button variant="outline" onClick={() => setStep(2)} className="h-9 sm:h-10 text-sm">
                  <ArrowLeft className="h-4 w-4 mr-1.5 sm:mr-2" />
                  上一步
                </Button>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="px-4 sm:px-8 h-9 sm:h-10 text-sm"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="mr-1.5 sm:mr-2 h-4 w-4 animate-spin" />
                      生成中...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-1.5 sm:mr-2 h-4 w-4" />
                      生成 {generateCount} 個腳本
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右側面板 - 目前設定摘要 */}
          <Card className="h-fit hidden lg:block">
            <CardHeader>
              <CardTitle className="text-base">目前設定</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">影片主題</p>
                <p className="font-medium">{videoSettings.topic || "—"}</p>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">拍攝方式</p>
                <p className="font-medium">{videoSettings.shootingType || "—"}</p>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{videoSettings.duration}秒</Badge>
                <Badge variant="secondary">{generateCount} 版本</Badge>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                以上問題不是必填，但回答越多，腳本品質越好！
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 4 - 生成結果 */}
      {step === 4 && generatedVersions.length > 0 && (
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
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(3)}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    重新調整
                  </Button>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setStep(1)
                      setGeneratedVersions([])
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重新開始
                  </Button>
                </div>
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
                    <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
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
                    </CardContent>
                  </Card>

                  {/* 側邊欄 - 手機版使用可折疊設計 */}
                  <div className="space-y-4 lg:space-y-4">
                    {/* 拍攝 & 剪輯建議 - 手機版合併成一個可折疊區塊 */}
                    <Card>
                      <Accordion type="single" collapsible defaultValue="shooting" className="w-full">
                        <AccordionItem value="shooting" className="border-0">
                          <AccordionTrigger className="px-4 sm:px-6 py-3 hover:no-underline">
                            <span className="text-base font-semibold">拍攝建議</span>
                          </AccordionTrigger>
                          <AccordionContent className="px-4 sm:px-6 pb-4">
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
                          </AccordionContent>
                        </AccordionItem>

                        {/* 剪輯建議 */}
                        {version.editingTips && version.editingTips.length > 0 && (
                          <AccordionItem value="editing" className="border-0 border-t">
                            <AccordionTrigger className="px-4 sm:px-6 py-3 hover:no-underline">
                              <span className="text-base font-semibold">剪輯建議</span>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 sm:px-6 pb-4">
                              <ul className="space-y-2 text-sm">
                                {version.editingTips.map((tip, index) => (
                                  <li key={index} className="flex items-start gap-2">
                                    <span className="text-primary font-medium">{index + 1}.</span>
                                    <span>{tip}</span>
                                  </li>
                                ))}
                              </ul>
                            </AccordionContent>
                          </AccordionItem>
                        )}
                      </Accordion>
                    </Card>

                    {/* 預估表現 */}
                    {version.estimatedMetrics && (
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">預估表現</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                            <span className="text-muted-foreground">完播率</span>
                            <span className="font-medium">{version.estimatedMetrics.completionRate || '—'}</span>
                          </div>
                          <div className="flex justify-between items-center p-2 rounded bg-muted/50 text-sm">
                            <span className="text-muted-foreground">互動率</span>
                            <span className="font-medium">{version.estimatedMetrics.engagementRate || '—'}</span>
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
                            <span>{version.estimatedMetrics.bestPostTime || '—'}</span>
                          </div>
                          {version.estimatedMetrics.bestPlatform && (
                            <div className="flex justify-between items-center p-2 rounded bg-primary/10 text-sm">
                              <span className="text-muted-foreground">最適平台</span>
                              <span className="font-medium text-primary">{version.estimatedMetrics.bestPlatform}</span>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

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

// 主頁面組件 - 用 Suspense 包裹以支援 useSearchParams
export default function ScriptGeneratorPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <ScriptGeneratorContent />
    </Suspense>
  )
}
