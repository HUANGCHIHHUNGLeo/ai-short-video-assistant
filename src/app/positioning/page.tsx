"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Target,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Users,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Copy,
  RotateCcw,
  TrendingUp,
  Compass,
  DollarSign,
  Trophy,
  Video,
  Clock,
  Globe,
  Eye,
  Download,
  History
} from "lucide-react"
import { useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 問卷資料類型（擴充版）
interface QuestionnaireData {
  // 第一階段：了解你是誰
  expertise: string           // Q1: 專長領域
  experience: string          // Q2: 獨特經歷/成就
  achievements: string        // Q3: 可展示的成果
  // 第二階段：了解你的受眾
  targetAudience: string      // Q4: 目標受眾
  painPoints: string          // Q5: 受眾痛點
  monetization: string        // Q6: 變現目標
  // 第三階段：了解你的資源
  contentStyle: string        // Q7: 出鏡偏好
  timeCommitment: string      // Q8: 可投入時間
  platforms: string[]         // Q9: 想經營的平台
  competitors: string         // Q10: 內容風格偏好
}

// 定位報告類型（擴充版 - 支援更多欄位）
interface PositioningReport {
  positioningStatement: string
  niche: string
  nicheAnalysis?: {
    marketSize: string
    growthTrend: string
    entryBarrier: string
  }
  targetAudience: {
    who: string
    age: string
    characteristics: string
    psychographics?: string
    onlineBehavior?: string
    mediaConsumption?: string
  }
  painPoints: string[]
  desires?: string[]
  uniqueValue: string
  personalBrand?: {
    archetype: string
    tone: string
    keywords: string[]
    visualStyle?: string
    contentPersonality?: string
  }
  contentPillars: {
    pillar: string
    description: string
    examples: string[]
    frequency?: string
    format?: string
  }[]
  contentFormats?: {
    format: string
    reason: string
    priority: string
    tips?: string
  }[]
  personaTags: string[]
  platformStrategy: {
    primary: string
    secondary: string
    reason: string
    postingSchedule?: string
    avoid?: string
    crossPlatformStrategy?: string
  }
  monetizationPath?: {
    shortTerm: string
    midTerm: string
    longTerm: string
    estimatedTimeline?: string
    revenueStreams?: string[]
    pricingStrategy?: string
  }
  competitorAnalysis: {
    level: string
    insight: string
    differentiator: string
    benchmarks?: string[]
    gaps?: string
  }
  swotAnalysis?: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  actionPlan: {
    phase: string
    tasks: string[]
  }[] | string[]
  firstWeekTasks?: string[]
  kpis?: {
    month1: string
    month3: string
    month6: string
  }
  warnings: string[]
  opportunities?: string[]
  confidence: number
  confidenceExplanation?: string
}

// 專長領域選項
const expertiseOptions = [
  "個人理財/投資",
  "職場成長/求職",
  "健身/減重",
  "美食/料理",
  "育兒/教養",
  "科技/3C",
  "心理/情感",
  "語言學習",
  "創業/商業",
  "美妝/穿搭",
  "旅遊/生活",
  "設計/創意",
  "攝影/影片",
  "音樂/藝術",
  "電商/行銷",
  "房地產"
]

// 目標受眾選項
const audienceOptions = [
  "大學生/新鮮人",
  "25-35歲上班族",
  "35-45歲主管/中階",
  "全職媽媽/爸爸",
  "自由工作者",
  "創業者/老闆",
  "退休族群",
  "特定產業從業者",
  "學生族群",
  "斜槓青年"
]

// 痛點選項
const painPointOptions = [
  "沒時間/效率低",
  "不知道怎麼開始",
  "資訊太多不知道選哪個",
  "預算有限",
  "缺乏動力/堅持不下去",
  "想轉行/轉型",
  "人際關係困擾",
  "健康/體態問題",
  "收入不穩定",
  "缺乏方向感"
]

// 變現目標選項
const monetizationOptions = [
  { value: "course", label: "賣線上課程", icon: "📚" },
  { value: "consulting", label: "接案/顧問服務", icon: "💼" },
  { value: "affiliate", label: "帶貨/聯盟行銷", icon: "🛒" },
  { value: "traffic", label: "引流到實體店/公司", icon: "🏪" },
  { value: "ad", label: "廣告收益/業配", icon: "📺" },
  { value: "community", label: "付費社群/會員制", icon: "👥" },
  { value: "brand", label: "純建立個人品牌", icon: "⭐" },
  { value: "unsure", label: "還不確定", icon: "🤔" }
]

// 出鏡偏好選項
const contentStyleOptions = [
  { value: "face", label: "真人出鏡", description: "露臉拍攝，建立親近感" },
  { value: "voice", label: "聲音出鏡", description: "配音+畫面，不露臉" },
  { value: "text", label: "純圖文", description: "圖片+文字，完全不出鏡" },
  { value: "mixed", label: "混合型", description: "根據內容靈活選擇" }
]

// 時間投入選項
const timeOptions = [
  { value: "5", label: "每週 5 小時以下", description: "副業心態，輕量經營" },
  { value: "10", label: "每週 5-10 小時", description: "認真經營，穩定產出" },
  { value: "20", label: "每週 10-20 小時", description: "半職業，大量產出" },
  { value: "full", label: "每週 20 小時以上", description: "全職投入" }
]

// 平台選項
const platformOptions = [
  { value: "instagram", label: "Instagram", icon: "📷" },
  { value: "tiktok", label: "TikTok/抖音", icon: "🎵" },
  { value: "youtube", label: "YouTube", icon: "▶️" },
  { value: "xiaohongshu", label: "小紅書", icon: "📕" },
  { value: "threads", label: "Threads", icon: "🧵" },
  { value: "facebook", label: "Facebook", icon: "👤" },
  { value: "linkedin", label: "LinkedIn", icon: "💼" },
  { value: "blog", label: "部落格/網站", icon: "📝" }
]

export default function PositioningPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [report, setReport] = useState<PositioningReport | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState<QuestionnaireData>({
    expertise: "",
    experience: "",
    achievements: "",
    targetAudience: "",
    painPoints: "",
    monetization: "",
    contentStyle: "",
    timeCommitment: "",
    platforms: [],
    competitors: ""
  })

  const { canUseFeature, useCredit, display, credits } = useCredits()

  // 檢查是否為專業版或買斷版用戶
  const isPro = credits?.tier === 'pro' || credits?.tier === 'lifetime'

  const totalSteps = 10

  // 計算階段
  const getPhase = (step: number) => {
    if (step <= 3) return { name: "了解你是誰", phase: 1 }
    if (step <= 6) return { name: "了解你的受眾", phase: 2 }
    if (step <= 10) return { name: "了解你的資源", phase: 3 }
    return { name: "報告", phase: 4 }
  }

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleOptionSelect = (field: keyof QuestionnaireData, value: string) => {
    if (field === 'platforms') {
      // 多選邏輯
      setFormData(prev => {
        const currentPlatforms = prev.platforms || []
        if (currentPlatforms.includes(value)) {
          return { ...prev, platforms: currentPlatforms.filter(p => p !== value) }
        } else {
          return { ...prev, platforms: [...currentPlatforms, value] }
        }
      })
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: prev[field] === value ? "" : value
      }))
    }
  }

  const handleInputChange = (field: keyof QuestionnaireData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.expertise.trim() !== ""
      case 2: return formData.experience.trim() !== ""
      case 3: return true // 成就可選填
      case 4: return formData.targetAudience.trim() !== ""
      case 5: return formData.painPoints.trim() !== ""
      case 6: return formData.monetization.trim() !== ""
      case 7: return formData.contentStyle.trim() !== ""
      case 8: return formData.timeCommitment.trim() !== ""
      case 9: return formData.platforms.length > 0
      case 10: return true // 競品可選填
      default: return false
    }
  }

  const handleGenerate = async () => {
    const creditCheck = canUseFeature('positioning')
    if (!creditCheck.canUse) {
      setCreditError(creditCheck.message || '額度不足')
      return
    }

    setCreditError(null)
    setIsGenerating(true)

    try {
      const response = await fetch("/api/positioning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "questionnaire",
          data: formData
        })
      })

      const data = await response.json()

      if (data.report) {
        if (data._creditConsumed) {
          useCredit('positioning')
        }
        setReport(data.report)
        setCurrentStep(11)
      } else if (data.error) {
        setCreditError(data.error)
      }
    } catch (error) {
      console.error("Error:", error)
      setCreditError("生成報告時發生錯誤，請稍後再試")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleReset = () => {
    setFormData({
      expertise: "",
      experience: "",
      achievements: "",
      targetAudience: "",
      painPoints: "",
      monetization: "",
      contentStyle: "",
      timeCommitment: "",
      platforms: [],
      competitors: ""
    })
    setReport(null)
    setCurrentStep(1)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // 複製完整報告
  const copyFullReport = () => {
    if (!report) return

    let text = `【自媒體定位報告】\n\n`
    text += `═══════════════════════════════════\n`
    text += `定位宣言：${report.positioningStatement}\n`
    text += `細分領域：${report.niche}\n`
    text += `定位可行性：${report.confidence}/100\n`
    text += `═══════════════════════════════════\n\n`

    text += `【目標受眾】\n`
    text += `- 誰：${report.targetAudience.who}\n`
    text += `- 年齡：${report.targetAudience.age}\n`
    text += `- 特徵：${report.targetAudience.characteristics}\n`
    if (report.targetAudience.psychographics) {
      text += `- 心理特徵：${report.targetAudience.psychographics}\n`
    }
    text += `\n`

    text += `【受眾痛點】\n`
    report.painPoints.forEach((point, i) => {
      text += `${i + 1}. ${point}\n`
    })
    text += `\n`

    text += `【獨特價值】\n${report.uniqueValue}\n\n`

    if (report.personalBrand) {
      text += `【個人品牌】\n`
      text += `- 人設類型：${report.personalBrand.archetype}\n`
      text += `- 說話風格：${report.personalBrand.tone}\n`
      text += `- 關鍵字：${report.personalBrand.keywords.join('、')}\n\n`
    }

    text += `【內容方向】\n`
    report.contentPillars.forEach((pillar, i) => {
      text += `${i + 1}. ${pillar.pillar}：${pillar.description}\n`
      text += `   範例：${pillar.examples.join('、')}\n`
    })
    text += `\n`

    text += `【平台策略】\n`
    text += `- 主力平台：${report.platformStrategy.primary}\n`
    text += `- 輔助平台：${report.platformStrategy.secondary}\n`
    text += `- 原因：${report.platformStrategy.reason}\n\n`

    if (report.monetizationPath) {
      text += `【變現路徑】\n`
      text += `- 短期：${report.monetizationPath.shortTerm}\n`
      text += `- 中期：${report.monetizationPath.midTerm}\n`
      text += `- 長期：${report.monetizationPath.longTerm}\n\n`
    }

    text += `【競爭分析】\n`
    text += `- 競爭程度：${report.competitorAnalysis.level}\n`
    text += `- 分析：${report.competitorAnalysis.insight}\n`
    text += `- 差異化：${report.competitorAnalysis.differentiator}\n\n`

    text += `【行動計畫】\n`
    if (report.actionPlan && Array.isArray(report.actionPlan)) {
      if (typeof report.actionPlan[0] === 'string') {
        (report.actionPlan as unknown as string[]).forEach((action, i) => {
          text += `${i + 1}. ${action}\n`
        })
      } else {
        (report.actionPlan as { phase: string; tasks: string[] }[]).forEach((phase) => {
          text += `【${phase.phase}】\n`
          phase.tasks.forEach((task, i) => {
            text += `  ${i + 1}. ${task}\n`
          })
        })
      }
    }
    text += `\n`

    if (report.warnings && report.warnings.length > 0) {
      text += `【注意事項】\n`
      report.warnings.forEach((warning, i) => {
        text += `${i + 1}. ${warning}\n`
      })
    }

    copyToClipboard(text)
  }

  // 下載報告為 TXT（完整版）
  const downloadReport = () => {
    if (!report) return

    let text = `════════════════════════════════════════════════════════════\n`
    text += `                    自媒體定位報告                          \n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `生成時間：${new Date().toLocaleString('zh-TW')}\n\n`

    text += `════════════════════════════════════════════════════════════\n`
    text += `  核心定位\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `定位宣言：${report.positioningStatement}\n`
    text += `細分領域：${report.niche}\n`
    text += `定位可行性：${report.confidence}/100\n`
    if (report.confidenceExplanation) {
      text += `評估說明：${report.confidenceExplanation}\n`
    }
    text += `\n`

    if (report.personaTags && report.personaTags.length > 0) {
      text += `人設標籤：${report.personaTags.map(t => `#${t}`).join(' ')}\n\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  目標受眾畫像\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `誰：${report.targetAudience?.who}\n`
    text += `年齡：${report.targetAudience?.age}\n`
    text += `特徵：${report.targetAudience?.characteristics}\n`
    if (report.targetAudience?.psychographics) {
      text += `心理特徵：${report.targetAudience.psychographics}\n`
    }
    if (report.targetAudience?.onlineBehavior) {
      text += `上網行為：${report.targetAudience.onlineBehavior}\n`
    }
    if (report.targetAudience?.mediaConsumption) {
      text += `媒體消費：${report.targetAudience.mediaConsumption}\n`
    }
    text += `\n`

    text += `════════════════════════════════════════════════════════════\n`
    text += `  受眾痛點\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    report.painPoints?.forEach((point, i) => {
      text += `${i + 1}. ${point}\n`
    })
    text += `\n`

    if (report.desires && report.desires.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  受眾渴望\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      report.desires.forEach((desire, i) => {
        text += `${i + 1}. ${desire}\n`
      })
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  獨特價值主張\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `${report.uniqueValue}\n\n`

    if (report.personalBrand) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  個人品牌建議\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      text += `品牌原型：${report.personalBrand.archetype}\n`
      text += `說話風格：${report.personalBrand.tone}\n`
      text += `關鍵字：${report.personalBrand.keywords?.join('、')}\n`
      if (report.personalBrand.visualStyle) {
        text += `視覺風格：${report.personalBrand.visualStyle}\n`
      }
      if (report.personalBrand.contentPersonality) {
        text += `內容人設：${report.personalBrand.contentPersonality}\n`
      }
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  內容方向建議\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    report.contentPillars?.forEach((pillar, i) => {
      text += `【${i + 1}. ${pillar.pillar}】\n`
      text += `說明：${pillar.description}\n`
      text += `範例：${pillar.examples?.join('、')}\n`
      if (pillar.frequency) text += `頻率：${pillar.frequency}\n`
      if (pillar.format) text += `形式：${pillar.format}\n`
      text += `\n`
    })

    if (report.contentFormats && report.contentFormats.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  內容形式建議\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      report.contentFormats.forEach((format, i) => {
        text += `${i + 1}. ${format.format}（${format.priority}）\n`
        text += `   原因：${format.reason}\n`
        if (format.tips) text += `   建議：${format.tips}\n`
      })
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  平台策略\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `主力平台：${report.platformStrategy?.primary}\n`
    text += `輔助平台：${report.platformStrategy?.secondary}\n`
    text += `策略原因：${report.platformStrategy?.reason}\n`
    if (report.platformStrategy?.postingSchedule) {
      text += `發布建議：${report.platformStrategy.postingSchedule}\n`
    }
    if (report.platformStrategy?.avoid) {
      text += `暫不建議：${report.platformStrategy.avoid}\n`
    }
    if (report.platformStrategy?.crossPlatformStrategy) {
      text += `跨平台策略：${report.platformStrategy.crossPlatformStrategy}\n`
    }
    text += `\n`

    if (report.monetizationPath) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  變現路徑規劃\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      text += `短期（0-6月）：${report.monetizationPath.shortTerm}\n`
      text += `中期（6-18月）：${report.monetizationPath.midTerm}\n`
      text += `長期（18月+）：${report.monetizationPath.longTerm}\n`
      if (report.monetizationPath.estimatedTimeline) {
        text += `預估時程：${report.monetizationPath.estimatedTimeline}\n`
      }
      if (report.monetizationPath.revenueStreams && report.monetizationPath.revenueStreams.length > 0) {
        text += `收入來源：${report.monetizationPath.revenueStreams.join('、')}\n`
      }
      if (report.monetizationPath.pricingStrategy) {
        text += `定價策略：${report.monetizationPath.pricingStrategy}\n`
      }
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  競爭分析\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    text += `競爭程度：${report.competitorAnalysis?.level}\n`
    text += `市場洞察：${report.competitorAnalysis?.insight}\n`
    text += `差異化切入點：${report.competitorAnalysis?.differentiator}\n`
    if (report.competitorAnalysis?.benchmarks && report.competitorAnalysis.benchmarks.length > 0) {
      text += `參考標竿：${report.competitorAnalysis.benchmarks.join('、')}\n`
    }
    if (report.competitorAnalysis?.gaps) {
      text += `市場缺口：${report.competitorAnalysis.gaps}\n`
    }
    text += `\n`

    if (report.swotAnalysis) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  SWOT 分析\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      text += `【優勢 Strengths】\n`
      report.swotAnalysis.strengths?.forEach(s => { text += `  + ${s}\n` })
      text += `\n【劣勢 Weaknesses】\n`
      report.swotAnalysis.weaknesses?.forEach(w => { text += `  - ${w}\n` })
      text += `\n【機會 Opportunities】\n`
      report.swotAnalysis.opportunities?.forEach(o => { text += `  ★ ${o}\n` })
      text += `\n【威脅 Threats】\n`
      report.swotAnalysis.threats?.forEach(t => { text += `  ! ${t}\n` })
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `  行動計畫\n`
    text += `════════════════════════════════════════════════════════════\n\n`
    if (report.actionPlan && Array.isArray(report.actionPlan)) {
      if (typeof report.actionPlan[0] === 'string') {
        (report.actionPlan as unknown as string[]).forEach((action, i) => {
          text += `${i + 1}. ${action}\n`
        })
      } else {
        (report.actionPlan as { phase: string; tasks: string[] }[]).forEach((phase) => {
          text += `【${phase.phase}】\n`
          phase.tasks?.forEach((task, i) => {
            text += `  ${i + 1}. ${task}\n`
          })
          text += `\n`
        })
      }
    }

    if (report.firstWeekTasks && report.firstWeekTasks.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  第一週必做清單\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      report.firstWeekTasks.forEach((task, i) => {
        text += `${i + 1}. ${task}\n`
      })
      text += `\n`
    }

    if (report.kpis) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  目標指標 KPI\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      text += `1 個月目標：${report.kpis.month1}\n`
      text += `3 個月目標：${report.kpis.month3}\n`
      text += `6 個月目標：${report.kpis.month6}\n\n`
    }

    if (report.opportunities && report.opportunities.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  潛在機會\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      report.opportunities.forEach((opp, i) => {
        text += `${i + 1}. ${opp}\n`
      })
      text += `\n`
    }

    if (report.warnings && report.warnings.length > 0) {
      text += `════════════════════════════════════════════════════════════\n`
      text += `  注意事項\n`
      text += `════════════════════════════════════════════════════════════\n\n`
      report.warnings.forEach((warning, i) => {
        text += `${i + 1}. ${warning}\n`
      })
      text += `\n`
    }

    text += `════════════════════════════════════════════════════════════\n`
    text += `                    報告結束                                \n`
    text += `════════════════════════════════════════════════════════════\n`

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `自媒體定位報告_${new Date().toISOString().slice(0, 10)}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  const getCompetitionColor = (level: string) => {
    if (level === "低") return "bg-green-500/10 text-green-600"
    if (level === "中") return "bg-yellow-500/10 text-yellow-600"
    if (level === "高") return "bg-orange-500/10 text-orange-600"
    return "bg-red-500/10 text-red-600"
  }

  const currentPhase = getPhase(currentStep)

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
              AI 定位教練
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              深度問卷 + AI 專業分析
              <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                剩餘 {display.script}
              </span>
            </p>
          </div>
        </div>
        <Link href="/positioning/history">
          <Button variant="outline" size="sm" className="gap-2">
            <History className="h-4 w-4" />
            <span className="hidden sm:inline">歷史記錄</span>
          </Button>
        </Link>
      </div>

      {/* Progress */}
      {currentStep <= totalSteps && (
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <div className="flex items-center gap-2">
              <Badge variant={currentPhase.phase === 1 ? "default" : "outline"} className="text-xs">
                階段 {currentPhase.phase}
              </Badge>
              <span className="text-muted-foreground">{currentPhase.name}</span>
            </div>
            <span className="text-muted-foreground">
              {currentStep} / {totalSteps}
            </span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>了解你是誰</span>
            <span>了解你的受眾</span>
            <span>了解你的資源</span>
          </div>
        </div>
      )}

      {/* Step 1: 專長領域 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-5 w-5 text-primary" />
              Q1. 你的專長領域是什麼？
            </CardTitle>
            <CardDescription>
              選擇最接近的選項，或直接輸入你的專長
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {expertiseOptions.map((option) => (
                <Badge
                  key={option}
                  variant={formData.expertise === option ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3 text-sm"
                  onClick={() => handleOptionSelect("expertise", option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <Label>或自訂輸入</Label>
              <Input
                placeholder="例如：室內設計、寵物訓練、程式教學..."
                value={expertiseOptions.includes(formData.expertise) ? "" : formData.expertise}
                onChange={(e) => handleInputChange("expertise", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 獨特經歷 */}
      {currentStep === 2 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Q2. 你有什麼獨特經歷或成就？
            </CardTitle>
            <CardDescription>
              這是你與眾不同的關鍵，越具體越好（數字、時間、成果）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 曾在 3 個月內減重 15 公斤&#10;- 5 年電商創業經驗，營收破千萬&#10;- 教過 200+ 學生學會英文會話&#10;- 從月薪 3 萬到年薪百萬的轉職經歷&#10;- 在某大公司擔任主管 10 年"
              className="min-h-[180px] sm:min-h-[200px]"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              提示：想想別人常來問你什麼問題？你解決過什麼困難？有什麼成果可以證明？
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: 可展示的成果 */}
      {currentStep === 3 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Q3. 你有什麼可展示的成果？（選填）
            </CardTitle>
            <CardDescription>
              證照、作品集、數據、案例...這些能增加你的說服力
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 擁有 Google Analytics 認證&#10;- 作品曾被某媒體報導&#10;- 幫助客戶業績成長 300%&#10;- 有 500+ 學員好評&#10;- 經營的帳號有 10 萬粉絲&#10;&#10;（如果目前沒有也沒關係，可以留空）"
              className="min-h-[150px]"
              value={formData.achievements}
              onChange={(e) => handleInputChange("achievements", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 4: 目標受眾 */}
      {currentStep === 4 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Q4. 你想幫助誰？
            </CardTitle>
            <CardDescription>
              定義你的目標受眾，越具體越好
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {audienceOptions.map((option) => (
                <Badge
                  key={option}
                  variant={formData.targetAudience === option ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3 text-sm"
                  onClick={() => handleOptionSelect("targetAudience", option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <Label>或更具體描述</Label>
              <Input
                placeholder="例如：想轉職的 30 歲工程師、剛生完小孩的新手媽媽..."
                value={audienceOptions.includes(formData.targetAudience) ? "" : formData.targetAudience}
                onChange={(e) => handleInputChange("targetAudience", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 5: 受眾痛點 */}
      {currentStep === 5 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Q5. 他們面臨什麼痛點？
            </CardTitle>
            <CardDescription>
              你的目標受眾最困擾的問題是什麼？
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="flex flex-wrap gap-2">
              {painPointOptions.map((option) => (
                <Badge
                  key={option}
                  variant={formData.painPoints === option ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/10 transition-colors py-1.5 px-3 text-sm"
                  onClick={() => handleOptionSelect("painPoints", option)}
                >
                  {option}
                </Badge>
              ))}
            </div>
            <div className="space-y-2">
              <Label>或更具體描述</Label>
              <Textarea
                placeholder="例如：想理財但不知道從哪開始、看了很多教學影片還是學不會..."
                className="min-h-[100px]"
                value={painPointOptions.includes(formData.painPoints) ? "" : formData.painPoints}
                onChange={(e) => handleInputChange("painPoints", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 6: 變現目標 */}
      {currentStep === 6 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Q6. 你的變現目標是什麼？
            </CardTitle>
            <CardDescription>
              你希望透過自媒體達成什麼商業目標？
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              {monetizationOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-pointer transition-all",
                    formData.monetization === option.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => handleOptionSelect("monetization", option.value)}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{option.icon}</span>
                    <span className="font-medium text-sm">{option.label}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 7: 出鏡偏好 */}
      {currentStep === 7 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Video className="h-5 w-5 text-primary" />
              Q7. 你願意怎麼出鏡？
            </CardTitle>
            <CardDescription>
              這會影響內容形式和平台選擇建議
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {contentStyleOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  formData.contentStyle === option.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => handleOptionSelect("contentStyle", option.value)}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 8: 時間投入 */}
      {currentStep === 8 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Q8. 你每週能投入多少時間？
            </CardTitle>
            <CardDescription>
              這會影響內容產量和平台策略建議
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {timeOptions.map((option) => (
              <div
                key={option.value}
                className={cn(
                  "p-4 rounded-lg border-2 cursor-pointer transition-all",
                  formData.timeCommitment === option.value
                    ? "border-primary bg-primary/5"
                    : "border-muted hover:border-primary/50"
                )}
                onClick={() => handleOptionSelect("timeCommitment", option.value)}
              >
                <div className="font-medium">{option.label}</div>
                <div className="text-sm text-muted-foreground">{option.description}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Step 9: 想經營的平台 */}
      {currentStep === 9 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Q9. 你想經營哪些平台？（可多選）
            </CardTitle>
            <CardDescription>
              選擇你有興趣或已經在使用的平台
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              {platformOptions.map((option) => {
                const isSelected = formData.platforms.includes(option.value)
                return (
                  <div
                    key={option.value}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all",
                      isSelected
                        ? "border-green-500 bg-green-500/10 ring-2 ring-green-500/20"
                        : "border-muted hover:border-primary/50"
                    )}
                    onClick={() => handleOptionSelect("platforms", option.value)}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && (
                        <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                      )}
                      <span className="text-xl">{option.icon}</span>
                      <span className={cn(
                        "font-medium text-sm",
                        isSelected && "text-green-700 dark:text-green-400"
                      )}>{option.label}</span>
                    </div>
                  </div>
                )
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              已選擇：{formData.platforms.length > 0
                ? formData.platforms.map(p => platformOptions.find(o => o.value === p)?.label).join('、')
                : '尚未選擇'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 10: 內容風格偏好 */}
      {currentStep === 10 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Q10. 你喜歡什麼風格的內容？（選填）
            </CardTitle>
            <CardDescription>
              描述你欣賞的內容風格，幫助我們找出適合你的差異化方向
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 喜歡講話很直接、不拐彎抹角的風格&#10;- 喜歡用故事帶出知識的方式&#10;- 喜歡畫面乾淨、節奏快的剪輯&#10;- 喜歡溫暖療癒、像朋友聊天的感覺&#10;- 喜歡數據分析、有憑有據的內容"
              className="min-h-[150px]"
              value={formData.competitors}
              onChange={(e) => handleInputChange("competitors", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              不需要提供帳號名稱，只需描述你欣賞的風格特點即可
            </p>
          </CardContent>
        </Card>
      )}

      {/* Report View */}
      {currentStep === 11 && report && (
        <div className="space-y-4 sm:space-y-6">
          {/* 定位宣言 */}
          <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-emerald-500/5">
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="text-center space-y-3">
                <Badge className="bg-primary">你的定位</Badge>
                <h2 className="text-xl sm:text-2xl font-bold">{report.positioningStatement}</h2>
                <p className="text-muted-foreground">細分領域：{report.niche}</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {report.personaTags?.map((tag, i) => (
                    <Badge key={i} variant="outline">#{tag}</Badge>
                  ))}
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(report.positioningStatement)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    {copied ? "已複製" : "複製定位"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 信心分數 + 競爭程度 */}
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="pt-6 px-4 sm:px-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">定位可行性</p>
                  <p className={cn("text-3xl font-bold", getConfidenceColor(report.confidence))}>
                    {report.confidence}/100
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 px-4 sm:px-6">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">競爭程度</p>
                  <Badge className={cn("text-lg px-4 py-1", getCompetitionColor(report.competitorAnalysis?.level || "中"))}>
                    {report.competitorAnalysis?.level || "中"}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <ScrollArea className="h-auto">
            <div className="space-y-4 sm:space-y-6">
              {/* 目標受眾 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    目標受眾畫像
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">誰？</p>
                      <p className="font-medium">{report.targetAudience?.who}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">年齡層</p>
                      <p className="font-medium">{report.targetAudience?.age}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">關鍵特徵</p>
                    <p className="font-medium">{report.targetAudience?.characteristics}</p>
                  </div>
                  {report.targetAudience?.psychographics && (
                    <div>
                      <p className="text-sm text-muted-foreground">心理特徵</p>
                      <p className="font-medium">{report.targetAudience.psychographics}</p>
                    </div>
                  )}
                  {report.targetAudience?.onlineBehavior && (
                    <div>
                      <p className="text-sm text-muted-foreground">上網行為</p>
                      <p className="font-medium">{report.targetAudience.onlineBehavior}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 痛點 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    受眾痛點
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ul className="space-y-2">
                    {report.painPoints?.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-orange-500 mt-1">•</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              {/* 獨特價值 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-yellow-500" />
                    你的獨特價值
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <p className="bg-yellow-500/10 p-3 rounded-lg">{report.uniqueValue}</p>
                </CardContent>
              </Card>

              {/* 個人品牌 - 專業版功能 */}
              {report.personalBrand && (
                isPro ? (
                  <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        個人品牌建議
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">人設類型</p>
                          <p className="font-medium">{report.personalBrand.archetype}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">說話風格</p>
                          <p className="font-medium">{report.personalBrand.tone}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">關鍵字標籤</p>
                        <div className="flex flex-wrap gap-1">
                          {report.personalBrand.keywords?.map((keyword, i) => (
                            <Badge key={i} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-6">
                      <div className="text-center">
                        <Badge className="mb-2 bg-purple-500">PRO</Badge>
                        <p className="text-sm text-muted-foreground mb-2">升級專業版解鎖個人品牌建議</p>
                        <Link href="/pricing">
                          <Button size="sm" variant="outline">查看方案</Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Target className="h-5 w-5 text-purple-500" />
                        個人品牌建議
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 space-y-3 blur-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-sm text-muted-foreground">人設類型</p>
                          <p className="font-medium">專業顧問型</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">說話風格</p>
                          <p className="font-medium">親切專業</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">關鍵字標籤</p>
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="secondary">實戰派</Badge>
                          <Badge variant="secondary">乾貨王</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {/* 內容支柱 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    內容方向建議
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-4">
                  {report.contentPillars?.map((pillar, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">{pillar.pillar}</p>
                        {pillar.frequency && (
                          <Badge variant="outline" className="text-xs">{pillar.frequency}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{pillar.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pillar.examples?.map((ex, j) => (
                          <Badge key={j} variant="secondary" className="text-xs">{ex}</Badge>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* 平台策略 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                    平台策略
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-3">
                  <div className="flex gap-2">
                    <Badge className="bg-blue-500">主力</Badge>
                    <span className="font-medium">{report.platformStrategy?.primary}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">輔助</Badge>
                    <span>{report.platformStrategy?.secondary}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.platformStrategy?.reason}</p>
                  {report.platformStrategy?.postingSchedule && (
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">發布建議</p>
                      <p className="text-sm">{report.platformStrategy.postingSchedule}</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* 變現路徑 - 專業版功能 */}
              {report.monetizationPath && (
                isPro ? (
                  <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        變現路徑規劃
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10">短期</Badge>
                          <span className="text-sm">{report.monetizationPath.shortTerm}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-500/10">中期</Badge>
                          <span className="text-sm">{report.monetizationPath.midTerm}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10">長期</Badge>
                          <span className="text-sm">{report.monetizationPath.longTerm}</span>
                        </div>
                      </div>
                      {report.monetizationPath.estimatedTimeline && (
                        <p className="text-xs text-muted-foreground">
                          預估時程：{report.monetizationPath.estimatedTimeline}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-6">
                      <div className="text-center">
                        <Badge className="mb-2 bg-green-500">PRO</Badge>
                        <p className="text-sm text-muted-foreground mb-2">升級專業版解鎖變現路徑規劃</p>
                        <Link href="/pricing">
                          <Button size="sm" variant="outline">查看方案</Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-green-500" />
                        變現路徑規劃
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 space-y-3 blur-sm">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-green-500/10">短期</Badge>
                          <span className="text-sm">建立信任、累積作品集</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-yellow-500/10">中期</Badge>
                          <span className="text-sm">推出付費產品</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-500/10">長期</Badge>
                          <span className="text-sm">打造被動收入系統</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {/* 競爭分析 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg">競爭分析</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-3">
                  <p className="text-sm">{report.competitorAnalysis?.insight}</p>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-primary">差異化切入點：</p>
                    <p className="text-sm">{report.competitorAnalysis?.differentiator}</p>
                  </div>
                  {report.competitorAnalysis?.benchmarks && report.competitorAnalysis.benchmarks.length > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">參考標竿：</p>
                      <div className="flex flex-wrap gap-1">
                        {report.competitorAnalysis.benchmarks.map((b, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{b}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SWOT 分析 */}
              {report.swotAnalysis && (
                isPro ? (
                  <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        SWOT 分析
                        <Badge className="bg-purple-500 text-[10px]">PRO</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-600 mb-2">優勢 Strengths</p>
                          <ul className="space-y-1">
                            {report.swotAnalysis.strengths?.map((s, i) => (
                              <li key={i} className="text-xs flex items-start gap-1">
                                <span className="text-green-500">+</span>
                                <span>{s}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-600 mb-2">劣勢 Weaknesses</p>
                          <ul className="space-y-1">
                            {report.swotAnalysis.weaknesses?.map((w, i) => (
                              <li key={i} className="text-xs flex items-start gap-1">
                                <span className="text-red-500">-</span>
                                <span>{w}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-600 mb-2">機會 Opportunities</p>
                          <ul className="space-y-1">
                            {report.swotAnalysis.opportunities?.map((o, i) => (
                              <li key={i} className="text-xs flex items-start gap-1">
                                <span className="text-blue-500">★</span>
                                <span>{o}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="bg-orange-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-orange-600 mb-2">威脅 Threats</p>
                          <ul className="space-y-1">
                            {report.swotAnalysis.threats?.map((t, i) => (
                              <li key={i} className="text-xs flex items-start gap-1">
                                <span className="text-orange-500">!</span>
                                <span>{t}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-6">
                      <div className="text-center">
                        <Badge className="mb-2 bg-purple-500">PRO</Badge>
                        <p className="text-sm text-muted-foreground mb-2">升級專業版解鎖 SWOT 分析</p>
                        <Link href="/pricing">
                          <Button size="sm" variant="outline">查看方案</Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg">SWOT 分析</CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 blur-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-green-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-green-600 mb-2">優勢 Strengths</p>
                          <ul className="space-y-1">
                            <li className="text-xs">• 你的獨特優勢</li>
                            <li className="text-xs">• 核心競爭力</li>
                          </ul>
                        </div>
                        <div className="bg-red-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-red-600 mb-2">劣勢 Weaknesses</p>
                          <ul className="space-y-1">
                            <li className="text-xs">• 需要改善的地方</li>
                            <li className="text-xs">• 潛在風險</li>
                          </ul>
                        </div>
                        <div className="bg-blue-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-blue-600 mb-2">機會 Opportunities</p>
                          <ul className="space-y-1">
                            <li className="text-xs">• 市場機會</li>
                            <li className="text-xs">• 成長空間</li>
                          </ul>
                        </div>
                        <div className="bg-orange-500/10 p-3 rounded-lg">
                          <p className="text-sm font-medium text-orange-600 mb-2">威脅 Threats</p>
                          <ul className="space-y-1">
                            <li className="text-xs">• 競爭威脅</li>
                            <li className="text-xs">• 環境挑戰</li>
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {/* 行動計畫 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    行動計畫
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  {report.actionPlan && Array.isArray(report.actionPlan) && (
                    typeof report.actionPlan[0] === 'string' ? (
                      <ol className="space-y-2">
                        {(report.actionPlan as unknown as string[]).map((action, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ol>
                    ) : (
                      <div className="space-y-4">
                        {(report.actionPlan as { phase: string; tasks: string[] }[]).map((phase, i) => (
                          <div key={i} className="border rounded-lg p-3">
                            <p className="font-medium mb-2">{phase.phase}</p>
                            <ol className="space-y-1">
                              {phase.tasks?.map((task, j) => (
                                <li key={j} className="flex items-start gap-2 text-sm">
                                  <span className="text-green-500">•</span>
                                  <span>{task}</span>
                                </li>
                              ))}
                            </ol>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </CardContent>
              </Card>

              {/* 第一週任務 */}
              {report.firstWeekTasks && report.firstWeekTasks.length > 0 && (
                isPro ? (
                  <Card className="border-primary/50">
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        第一週必做清單
                        <Badge className="bg-purple-500 text-[10px]">PRO</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <ol className="space-y-2">
                        {report.firstWeekTasks.map((task, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">
                              {i + 1}
                            </span>
                            <span className="text-sm">{task}</span>
                          </li>
                        ))}
                      </ol>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="relative overflow-hidden border-primary/50">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-6">
                      <div className="text-center">
                        <Badge className="mb-2 bg-purple-500">PRO</Badge>
                        <p className="text-sm text-muted-foreground mb-2">升級專業版解鎖第一週任務清單</p>
                        <Link href="/pricing">
                          <Button size="sm" variant="outline">查看方案</Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        第一週必做清單
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 blur-sm">
                      <ol className="space-y-2">
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">1</span>
                          <span className="text-sm">設定帳號基本資訊</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">2</span>
                          <span className="text-sm">發佈第一支測試影片</span>
                        </li>
                        <li className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-white text-sm flex items-center justify-center">3</span>
                          <span className="text-sm">觀察數據反應</span>
                        </li>
                      </ol>
                    </CardContent>
                  </Card>
                )
              )}

              {/* KPI 指標 */}
              {report.kpis && (
                isPro ? (
                  <Card>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        目標指標 KPI
                        <Badge className="bg-purple-500 text-[10px]">PRO</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="min-w-[60px] justify-center">1 個月</Badge>
                          <span className="text-sm">{report.kpis.month1}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="min-w-[60px] justify-center">3 個月</Badge>
                          <span className="text-sm">{report.kpis.month3}</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="min-w-[60px] justify-center">6 個月</Badge>
                          <span className="text-sm">{report.kpis.month6}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-6">
                      <div className="text-center">
                        <Badge className="mb-2 bg-purple-500">PRO</Badge>
                        <p className="text-sm text-muted-foreground mb-2">升級專業版解鎖 KPI 目標指標</p>
                        <Link href="/pricing">
                          <Button size="sm" variant="outline">查看方案</Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                        目標指標 KPI
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 blur-sm">
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="min-w-[60px] justify-center">1 個月</Badge>
                          <span className="text-sm">設定你的第一個月目標</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="min-w-[60px] justify-center">3 個月</Badge>
                          <span className="text-sm">建立穩定的內容節奏</span>
                        </div>
                        <div className="flex items-start gap-3">
                          <Badge variant="outline" className="min-w-[60px] justify-center">6 個月</Badge>
                          <span className="text-sm">達成階段性里程碑</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              )}

              {/* 機會 */}
              {report.opportunities && report.opportunities.length > 0 && (
                isPro ? (
                  <Card className="border-green-500/50">
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-5 w-5" />
                        潛在機會
                        <Badge className="bg-purple-500 text-[10px]">PRO</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6">
                      <ul className="space-y-2">
                        {report.opportunities.map((opp, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="text-green-500 mt-1">✓</span>
                            <span>{opp}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="relative overflow-hidden border-green-500/50">
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background z-10 flex items-end justify-center pb-6">
                      <div className="text-center">
                        <Badge className="mb-2 bg-purple-500">PRO</Badge>
                        <p className="text-sm text-muted-foreground mb-2">升級專業版解鎖潛在機會分析</p>
                        <Link href="/pricing">
                          <Button size="sm" variant="outline">查看方案</Button>
                        </Link>
                      </div>
                    </div>
                    <CardHeader className="px-4 sm:px-6 pb-2">
                      <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-green-600">
                        <TrendingUp className="h-5 w-5" />
                        潛在機會
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="px-4 sm:px-6 blur-sm">
                      <ul className="space-y-2">
                        <li className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>市場趨勢機會</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>合作夥伴機會</span>
                        </li>
                        <li className="flex items-start gap-2 text-sm">
                          <span className="text-green-500 mt-1">✓</span>
                          <span>變現模式機會</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                )
              )}

              {/* 注意事項 */}
              {report.warnings && report.warnings.length > 0 && (
                <Card className="border-orange-500/50">
                  <CardHeader className="px-4 sm:px-6 pb-2">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2 text-orange-600">
                      <AlertTriangle className="h-5 w-5" />
                      注意事項
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <ul className="space-y-2">
                      {report.warnings.map((warning, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-orange-500 mt-1">⚠</span>
                          <span>{warning}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>

          {/* 操作按鈕 */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={copyFullReport}>
              <Copy className="h-4 w-4 mr-2" />
              {copied ? "已複製" : "複製報告"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={downloadReport}>
              <Download className="h-4 w-4 mr-2" />
              下載報告
            </Button>
          </div>
          <Button variant="ghost" className="w-full" onClick={handleReset}>
            <RotateCcw className="h-4 w-4 mr-2" />
            重新分析
          </Button>
        </div>
      )}

      {/* 額度不足提示 */}
      {creditError && (
        <CreditsAlert message={creditError} featureType="script" />
      )}

      {/* Navigation Buttons */}
      {currentStep <= totalSteps && (
        <div className="flex gap-3">
          {currentStep > 1 && (
            <Button variant="outline" onClick={handleBack} className="flex-1">
              <ChevronLeft className="h-4 w-4 mr-2" />
              上一步
            </Button>
          )}
          {currentStep < totalSteps ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1"
            >
              下一步
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleGenerate}
              disabled={!canProceed() || isGenerating}
              className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600"
            >
              {isGenerating ? (
                <>
                  <Sparkles className="h-4 w-4 mr-2 animate-spin" />
                  AI 正在深度分析...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成專業定位報告
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
