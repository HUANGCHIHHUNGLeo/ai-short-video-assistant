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

// 背景故事結構化資料
interface BackgroundStoryData {
  growthEnvironment: string   // 成長經歷：在什麼環境下長大
  turningPoint: string        // 轉折點：人生重大轉折
  challenges: string          // 挫折與成長：遇過的挫折
  values: string              // 價值觀：最在乎什麼
  motivation: string          // 動機：為什麼做現在的事業
}

// 問卷資料類型（專業代操公司版本）
interface QuestionnaireData {
  // 第一階段：目標與定位
  goals: string               // Q1: 希望藉由代操達成的目標
  targetDirections: string[]  // Q2: 希望代操的目標導向（多選）
  imageStyle: string          // Q3: 螢幕形象呈現
  // 第二階段：個人特色挖掘
  hobbies: string             // Q4: 特別的愛好或興趣
  uniqueTraits: string        // Q5: 最能顯現自己特色的地方
  othersPerception: string    // Q6: 朋友或家人覺得你是什麼樣的人
  // 第三階段：工作與專業
  workChallenges: string      // Q7: 工作中的日常或會遇到的挑戰
  competitiveAdvantage: string // Q8: 商品或服務跟同業相比的優勢
  // 第四階段：可用資源
  locationResources: string   // Q9: 可以拍攝使用的場地資源
  interactionResources: string // Q10: 可以拍攝的互動資源
  itemResources: string       // Q11: 可以拍攝的物品資源
  // 第五階段：背景經歷
  workHistory: string         // Q12: 曾經的工作經歷
  education: string           // Q13: 大學讀的科系
  clubExperience: string      // Q14: 曾經的社團、興趣經歷
  backgroundStory: BackgroundStoryData  // Q15: 個人背景故事（結構化）
}

// 定位報告類型（專業代操公司版本）
interface PositioningReport {
  positioningStatement: string
  niche: string

  // 人設定位
  persona?: {
    coreIdentity: string
    memoryHook: string
    toneOfVoice: string
    visualStyle: string
    catchphrase?: string
  }

  // 目標受眾
  targetAudience: {
    who: string
    age: string
    characteristics: string
    painPoints?: string[]
    desires?: string[]
    // 舊版相容欄位
    psychographics?: string
    onlineBehavior?: string
    mediaConsumption?: string
  }

  // 舊版欄位（向後相容）
  painPoints?: string[]
  desires?: string[]
  uniqueValue?: string
  personalBrand?: {
    archetype: string
    tone: string
    keywords: string[]
    visualStyle?: string
    contentPersonality?: string
  }

  // 內容方向
  contentPillars: {
    pillar: string
    ratio?: string
    description: string
    topics?: string[]
    examples?: string[]
    hooks?: string[]
    frequency?: string
    format?: string
  }[]

  // 資源運用
  resourceUtilization?: {
    locations?: { resource: string; contentIdeas: string[] }[]
    interactions?: { resource: string; contentIdeas: string[] }[]
    items?: { resource: string; contentIdeas: string[] }[]
  }

  // 故事素材
  storyAssets?: {
    workExperience: string
    education: string
    otherExperience: string
  }

  // 背景故事分析
  backgroundStoryAnalysis?: {
    summary: string           // 背景故事摘要
    keyMoments: string[]      // 關鍵轉折點
    emotionalHooks: string[]  // 可用的情感連結點
    contentAngles: string[]   // 可以發展的內容角度
    authenticityScore: number // 真實感分數 (0-100)
    resonancePoints: string[] // 容易引起共鳴的點
  }

  // 前 10 支影片建議
  first10Videos?: {
    title: string
    hook: string
    angle: string
    resource?: string
  }[]

  // 平台策略
  platformStrategy: {
    primary: string
    reason: string
    postingSchedule?: string
    contentMix?: string
    // 舊版相容欄位
    secondary?: string
    avoid?: string
    crossPlatformStrategy?: string
  }

  // 差異化
  differentiator?: {
    vsCompetitors: string
    uniqueAdvantage: string
    avoidPitfalls?: string
  }

  // 舊版競爭分析（向後相容）
  competitorAnalysis?: {
    level: string
    insight: string
    differentiator: string
    referenceStyles?: string[]
    benchmarks?: string[]
    gaps?: string
  }

  // 行動計畫
  actionPlan: {
    week1?: string[]
    week2to4?: string[]
    month2to3?: string[]
    // 舊版格式
    phase?: string
    tasks?: string[]
  }[] | { week1: string[]; week2to4: string[]; month2to3: string[] } | string[]

  // 舊版欄位（向後相容）
  personaTags?: string[]
  monetizationPath?: {
    shortTerm: string
    midTerm: string
    longTerm: string
    estimatedTimeline?: string
    revenueStreams?: string[]
    pricingStrategy?: string
  }
  swotAnalysis?: {
    strengths: string[]
    weaknesses: string[]
    opportunities: string[]
    threats: string[]
  }
  firstWeekTasks?: string[]
  kpis?: {
    month1: string | { target: string; howToAchieve: string; keyMetrics: string }
    month3: string | { target: string; howToAchieve: string; milestone: string }
    month6: string | { target: string; howToAchieve: string; revenueBreakdown: string }
  }
  contentFormats?: {
    format: string
    reason: string
    priority: string
    tips?: string
  }[]

  // 風險與機會
  warnings: string[]
  opportunities?: string[]

  // 信心分數
  confidence: number
  confidenceReason?: string
  confidenceExplanation?: string

  // 顧問寄語
  consultantNote?: string
}

// 目標導向選項
const targetDirectionOptions = [
  { value: "brand_awareness", label: "品牌曝光", description: "讓更多人認識你/你的品牌" },
  { value: "lead_generation", label: "名單蒐集", description: "獲取潛在客戶名單" },
  { value: "sales_conversion", label: "銷售轉換", description: "直接促成購買或成交" },
  { value: "community_building", label: "社群經營", description: "建立忠實粉絲社群" },
  { value: "thought_leadership", label: "專業形象", description: "建立業界專家地位" },
  { value: "recruitment", label: "人才招募", description: "吸引優秀人才加入" }
]

// 螢幕形象選項
const imageStyleOptions = [
  { value: "humorous", label: "幽默輕鬆感", description: "用幽默方式傳遞訊息" },
  { value: "professional", label: "專業權威型", description: "展現專業可信度" },
  { value: "authentic", label: "真實自然型", description: "呈現真實的自己" },
  { value: "warm", label: "溫暖親切型", description: "像朋友一樣親近" },
  { value: "energetic", label: "熱情活力型", description: "充滿正能量感染力" },
  { value: "storyteller", label: "故事敘述型", description: "用故事帶出觀點" },
  { value: "educational", label: "知識教學型", description: "清楚傳授知識技能" },
  { value: "inspirational", label: "激勵啟發型", description: "鼓勵激勵觀眾" }
]

export default function PositioningPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [report, setReport] = useState<PositioningReport | null>(null)
  const [copied, setCopied] = useState(false)

  const [formData, setFormData] = useState<QuestionnaireData>({
    // 第一階段：目標與定位
    goals: "",
    targetDirections: [],
    imageStyle: "",
    // 第二階段：個人特色挖掘
    hobbies: "",
    uniqueTraits: "",
    othersPerception: "",
    // 第三階段：工作與專業
    workChallenges: "",
    competitiveAdvantage: "",
    // 第四階段：可用資源
    locationResources: "",
    interactionResources: "",
    itemResources: "",
    // 第五階段：背景經歷
    workHistory: "",
    education: "",
    clubExperience: "",
    backgroundStory: {
      growthEnvironment: "",
      turningPoint: "",
      challenges: "",
      values: "",
      motivation: ""
    }
  })

  const { canUseFeature, useCredit, display, credits } = useCredits()

  // 檢查是否為專業版或買斷版用戶
  const isPro = credits?.tier === 'pro' || credits?.tier === 'lifetime'

  const totalSteps = 15

  // 計算問卷填寫完整度
  const calculateCompleteness = () => {
    const checks = [
      // 必填項目（權重較高）
      { field: 'goals', weight: 15, minLength: 20, label: '目標' },
      { field: 'targetDirections', weight: 10, isArray: true, label: '目標導向' },
      { field: 'imageStyle', weight: 10, minLength: 1, label: '螢幕形象' },
      // 重要項目（中等權重）
      { field: 'uniqueTraits', weight: 10, minLength: 10, label: '個人特色' },
      { field: 'workChallenges', weight: 8, minLength: 10, label: '工作挑戰' },
      { field: 'competitiveAdvantage', weight: 8, minLength: 10, label: '競爭優勢' },
      // 選填項目（較低權重）
      { field: 'hobbies', weight: 5, minLength: 5, label: '愛好興趣' },
      { field: 'othersPerception', weight: 5, minLength: 10, label: '他人評價' },
      { field: 'locationResources', weight: 4, minLength: 5, label: '場地資源' },
      { field: 'interactionResources', weight: 4, minLength: 5, label: '互動資源' },
      { field: 'itemResources', weight: 4, minLength: 5, label: '物品資源' },
      { field: 'workHistory', weight: 5, minLength: 10, label: '工作經歷' },
      { field: 'education', weight: 2, minLength: 2, label: '教育背景' },
      { field: 'clubExperience', weight: 3, minLength: 5, label: '社團經歷' },
    ]

    // 背景故事單獨計算
    const storyChecks = [
      { field: 'growthEnvironment', weight: 2, minLength: 10, label: '成長經歷' },
      { field: 'turningPoint', weight: 3, minLength: 15, label: '人生轉折' },
      { field: 'challenges', weight: 3, minLength: 15, label: '挫折經歷' },
      { field: 'values', weight: 1, minLength: 5, label: '價值觀' },
      { field: 'motivation', weight: 2, minLength: 10, label: '創業動機' },
    ]

    let totalWeight = 0
    let earnedWeight = 0
    const missingItems: string[] = []
    const weakItems: string[] = []

    // 檢查主要欄位
    checks.forEach(check => {
      totalWeight += check.weight
      const value = formData[check.field as keyof QuestionnaireData]

      if (check.isArray) {
        if (Array.isArray(value) && value.length > 0) {
          earnedWeight += check.weight
        } else {
          missingItems.push(check.label)
        }
      } else if (typeof value === 'string') {
        if (value.trim().length >= (check.minLength || 1)) {
          earnedWeight += check.weight
        } else if (value.trim().length > 0) {
          earnedWeight += check.weight * 0.5
          weakItems.push(check.label)
        } else if (check.weight >= 8) {
          missingItems.push(check.label)
        }
      }
    })

    // 檢查背景故事
    storyChecks.forEach(check => {
      totalWeight += check.weight
      const value = formData.backgroundStory[check.field as keyof BackgroundStoryData]
      if (value && value.trim().length >= (check.minLength || 1)) {
        earnedWeight += check.weight
      } else if (value && value.trim().length > 0) {
        earnedWeight += check.weight * 0.5
      }
    })

    const percentage = Math.round((earnedWeight / totalWeight) * 100)

    return {
      percentage,
      missingItems,
      weakItems,
      level: percentage >= 80 ? 'excellent' : percentage >= 60 ? 'good' : percentage >= 40 ? 'fair' : 'low'
    }
  }

  const completeness = calculateCompleteness()

  // 計算階段
  const getPhase = (step: number) => {
    if (step <= 3) return { name: "目標與定位", phase: 1 }
    if (step <= 6) return { name: "個人特色挖掘", phase: 2 }
    if (step <= 8) return { name: "工作與專業", phase: 3 }
    if (step <= 11) return { name: "可用資源", phase: 4 }
    if (step <= 15) return { name: "背景經歷", phase: 5 }
    return { name: "報告", phase: 6 }
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
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] === value ? "" : value
    }))
  }

  const handleInputChange = (field: keyof QuestionnaireData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const canProceed = () => {
    switch (currentStep) {
      case 1: return formData.goals.trim() !== ""              // Q1: 目標必填
      case 2: return formData.targetDirections.length > 0       // Q2: 目標導向至少選一個
      case 3: return formData.imageStyle.trim() !== ""          // Q3: 形象必填
      case 4: return true                                        // Q4: 愛好選填
      case 5: return true                                        // Q5: 特色選填
      case 6: return true                                        // Q6: 他人看法選填
      case 7: return true                                        // Q7: 工作挑戰選填
      case 8: return true                                        // Q8: 競爭優勢選填
      case 9: return true                                        // Q9: 場地資源選填
      case 10: return true                                       // Q10: 互動資源選填
      case 11: return true                                       // Q11: 物品資源選填
      case 12: return true                                       // Q12: 工作經歷選填
      case 13: return true                                       // Q13: 教育背景選填
      case 14: return true                                       // Q14: 社團經歷選填
      case 15: return true                                       // Q15: 背景故事選填（結構化）
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
        setCurrentStep(16)  // 報告頁面
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
      goals: "",
      targetDirections: [],
      imageStyle: "",
      hobbies: "",
      uniqueTraits: "",
      othersPerception: "",
      workChallenges: "",
      competitiveAdvantage: "",
      locationResources: "",
      interactionResources: "",
      itemResources: "",
      workHistory: "",
      education: "",
      clubExperience: "",
      backgroundStory: {
        growthEnvironment: "",
        turningPoint: "",
        challenges: "",
        values: "",
        motivation: ""
      }
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
    const painPointsList = report.painPoints || report.targetAudience?.painPoints || []
    painPointsList.forEach((point, i) => {
      text += `${i + 1}. ${point}\n`
    })
    text += `\n`

    if (report.uniqueValue) {
      text += `【獨特價值】\n${report.uniqueValue}\n\n`
    }

    if (report.personalBrand) {
      text += `【個人品牌】\n`
      text += `- 人設類型：${report.personalBrand.archetype}\n`
      text += `- 說話風格：${report.personalBrand.tone}\n`
      text += `- 關鍵字：${report.personalBrand.keywords.join('、')}\n\n`
    }

    text += `【內容方向】\n`
    report.contentPillars?.forEach((pillar, i) => {
      text += `${i + 1}. ${pillar.pillar}：${pillar.description}\n`
      const examples = pillar.examples || pillar.topics || []
      if (examples.length > 0) {
        text += `   範例：${examples.join('、')}\n`
      }
    })
    text += `\n`

    text += `【平台策略】\n`
    text += `- 主力平台：${report.platformStrategy?.primary || ''}\n`
    if (report.platformStrategy?.secondary) {
      text += `- 輔助平台：${report.platformStrategy.secondary}\n`
    }
    text += `- 原因：${report.platformStrategy?.reason || ''}\n\n`

    if (report.monetizationPath) {
      text += `【變現路徑】\n`
      text += `- 短期：${report.monetizationPath.shortTerm}\n`
      text += `- 中期：${report.monetizationPath.midTerm}\n`
      text += `- 長期：${report.monetizationPath.longTerm}\n\n`
    }

    if (report.competitorAnalysis) {
      text += `【競爭分析】\n`
      text += `- 競爭程度：${report.competitorAnalysis.level}\n`
      text += `- 分析：${report.competitorAnalysis.insight}\n`
      text += `- 差異化：${report.competitorAnalysis.differentiator}\n\n`
    } else if (report.differentiator) {
      text += `【差異化分析】\n`
      text += `- 與競爭者的差異：${report.differentiator.vsCompetitors}\n`
      text += `- 獨特優勢：${report.differentiator.uniqueAdvantage}\n\n`
    }

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
              深度定位教練
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
          <div className="flex justify-between text-xs text-muted-foreground overflow-x-auto gap-2">
            <span className="whitespace-nowrap">目標定位</span>
            <span className="whitespace-nowrap">個人特色</span>
            <span className="whitespace-nowrap">工作專業</span>
            <span className="whitespace-nowrap">可用資源</span>
            <span className="whitespace-nowrap">背景經歷</span>
          </div>
        </div>
      )}

      {/* Step 1: 希望達成的目標 */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-5 w-5 text-primary" />
              Q1. 希望藉由代操能達成的目標
            </CardTitle>
            <CardDescription>
              以終為始，我們會依您期待的目標去回推內容規劃
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 希望透過短影音增加品牌知名度，讓更多人認識我們的產品&#10;- 想要建立個人專業形象，成為業界意見領袖&#10;- 希望能夠引流到實體店面，增加來客數&#10;- 想要蒐集潛在客戶名單，之後可以銷售線上課程&#10;- 希望建立粉絲社群，未來可以推出付費會員制"
              className="min-h-[180px]"
              value={formData.goals}
              onChange={(e) => handleInputChange("goals", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              提示：目標越明確，內容規劃就越精準。可以包含短期和長期目標。
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: 目標導向（多選） */}
      {currentStep === 2 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Q2. 希望代操的目標導向？
            </CardTitle>
            <CardDescription>
              可複選，選擇所有符合您需求的目標導向
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            {targetDirectionOptions.map((option) => {
              const isSelected = formData.targetDirections.includes(option.value)
              return (
                <div
                  key={option.value}
                  className={cn(
                    "p-4 rounded-lg border-2 cursor-pointer transition-all",
                    isSelected
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      targetDirections: isSelected
                        ? prev.targetDirections.filter(v => v !== option.value)
                        : [...prev.targetDirections, option.value]
                    }))
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
                      isSelected ? "border-primary bg-primary" : "border-muted-foreground"
                    )}>
                      {isSelected && <CheckCircle2 className="h-4 w-4 text-white" />}
                    </div>
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-sm text-muted-foreground">{option.description}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            {formData.targetDirections.length > 0 && (
              <p className="text-sm text-primary">
                已選擇 {formData.targetDirections.length} 項
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: 螢幕形象 */}
      {currentStep === 3 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Video className="h-5 w-5 text-primary" />
              Q3. 希望自己的螢幕形象呈現什麼感覺？
            </CardTitle>
            <CardDescription>
              選擇最符合您想要呈現的風格
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 px-4 sm:px-6">
            <div className="grid grid-cols-2 gap-3">
              {imageStyleOptions.map((option) => (
                <div
                  key={option.value}
                  className={cn(
                    "p-3 rounded-lg border-2 cursor-pointer transition-all",
                    formData.imageStyle === option.value
                      ? "border-primary bg-primary/5"
                      : "border-muted hover:border-primary/50"
                  )}
                  onClick={() => handleOptionSelect("imageStyle", option.value)}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: 愛好興趣 */}
      {currentStep === 4 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              Q4. 您有哪些特別的愛好或興趣？
            </CardTitle>
            <CardDescription>
              有沒有什麼是特別擅長或熱衷於分享的？這些可以成為內容素材
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 收藏老車，有好幾台古董車&#10;- 會跟爸爸去挖野生筍子&#10;- 喜歡打網球，每週固定練習&#10;- 種茶有自己的茶園&#10;- 喜歡潛水，去過很多國家潛點&#10;- 收藏球鞋，有上百雙&#10;&#10;（選填，但有特別愛好會讓內容更有記憶點）"
              className="min-h-[180px]"
              value={formData.hobbies}
              onChange={(e) => handleInputChange("hobbies", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 5: 個人特色 */}
      {currentStep === 5 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Q5. 您覺得最能顯現自己特色的地方是什麼？
            </CardTitle>
            <CardDescription>
              個人特色、興趣愛好等，這部分可多補充描述
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 我很豪爽，每次都被形容是社牛&#10;- 是大胃王，常被朋友挑戰吃東西&#10;- 喜歡極限運動，什麼都敢嘗試&#10;- 長得氣質但個性大辣辣，反差很大&#10;- 很會講冷笑話，朋友都說我是諧星&#10;- 聲音很有辨識度，常被說適合當主播"
              className="min-h-[180px]"
              value={formData.uniqueTraits}
              onChange={(e) => handleInputChange("uniqueTraits", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 6: 他人看法 */}
      {currentStep === 6 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Q6. 您的朋友或家人覺得你是一個怎麼樣的人？
            </CardTitle>
            <CardDescription>
              旁人的觀察往往能發現自己沒注意到的特質
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 比較悶騷，遇到熟的朋友比較熱情&#10;- 愛搞怪、創意很多&#10;- 重義氣，朋友有事一定幫忙&#10;- 呆萌，常做一些天然的事&#10;- 很細心，會注意到別人沒注意的事&#10;- 說話很直接，但大家都知道我是刀子嘴豆腐心"
              className="min-h-[180px]"
              value={formData.othersPerception}
              onChange={(e) => handleInputChange("othersPerception", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 7: 工作挑戰 */}
      {currentStep === 7 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Q7. 您在工作中的日常或會遇到的挑戰？
            </CardTitle>
            <CardDescription>
              這些真實的工作場景可以成為很好的內容素材
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 每天要處理很多客戶的各種問題&#10;- 常常要跟供應商談判價格&#10;- 需要管理團隊，處理人事問題&#10;- 要跟上快速變化的市場趨勢&#10;- 常常需要教導新進員工&#10;- 要平衡品質和成本的壓力"
              className="min-h-[180px]"
              value={formData.workChallenges}
              onChange={(e) => handleInputChange("workChallenges", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 8: 競爭優勢 */}
      {currentStep === 8 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Q8. 您的商品或服務跟同業相比有什麼優勢？
            </CardTitle>
            <CardDescription>
              找出差異化的賣點，讓觀眾知道為什麼要選擇你
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 我們是自有工廠，價格比較有競爭力&#10;- 有獨家技術，別人做不出來&#10;- 服務比較細緻，會做到客戶滿意為止&#10;- 經驗很豐富，處理過各種疑難雜症&#10;- 有專業證照，比較有保障&#10;- 交期比較快，急單也能處理"
              className="min-h-[180px]"
              value={formData.competitiveAdvantage}
              onChange={(e) => handleInputChange("competitiveAdvantage", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 9: 場地資源 */}
      {currentStep === 9 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Globe className="h-5 w-5 text-primary" />
              Q9. 您認為可以拍攝使用的「場地資源」
            </CardTitle>
            <CardDescription>
              有話題性的地點可以讓內容更吸引人
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 朋友開的網美咖啡廳&#10;- 自己有投資的健身房&#10;- 公司的工廠產線&#10;- 診所的看診空間&#10;- 養豬場、農場&#10;- 自己的茶園&#10;- 很漂亮的辦公室&#10;- 有特色的店面"
              className="min-h-[180px]"
              value={formData.locationResources}
              onChange={(e) => handleInputChange("locationResources", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 10: 互動資源 */}
      {currentStep === 10 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              Q10. 您認為可以拍攝的「互動資源」
            </CardTitle>
            <CardDescription>
              有趣的人物互動可以讓內容更有溫度
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 和小孩的互動很有趣，常常有笑料&#10;- 父母很搞笑，可以一起拍&#10;- 和另一半會鬥嘴但很快就合好&#10;- 員工很有梗，可以一起入鏡&#10;- 有養寵物，很會搶鏡頭&#10;- 朋友圈有很多有趣的人可以合作"
              className="min-h-[180px]"
              value={formData.interactionResources}
              onChange={(e) => handleInputChange("interactionResources", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 11: 物品資源 */}
      {currentStep === 11 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Eye className="h-5 w-5 text-primary" />
              Q11. 您認為可以拍攝的「物品資源」
            </CardTitle>
            <CardDescription>
              較特別可以延伸話題的物品
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 跑車、重機&#10;- 手錶收藏&#10;- 雪茄、紅酒收藏&#10;- 公仔、球鞋收藏&#10;- 特殊的工具或設備&#10;- 有故事的老物件&#10;- 自己設計的產品"
              className="min-h-[180px]"
              value={formData.itemResources}
              onChange={(e) => handleInputChange("itemResources", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 12: 工作經歷 */}
      {currentStep === 12 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Q12. 曾經的工作經歷
            </CardTitle>
            <CardDescription>
              過去的工作經驗可以成為專業背書
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 房仲 2 年&#10;- 數學老師 3 年&#10;- 外商業務 5 年&#10;- 餐飲業經理 4 年&#10;- 工程師 8 年"
              className="min-h-[150px]"
              value={formData.workHistory}
              onChange={(e) => handleInputChange("workHistory", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 13: 教育背景 */}
      {currentStep === 13 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Clock className="h-5 w-5 text-primary" />
              Q13. 大學讀的科系
            </CardTitle>
            <CardDescription>
              學歷背景也是可以運用的素材
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 企管系&#10;- 高中讀表演藝術科&#10;- 資工系碩士&#10;- 設計相關科系"
              className="min-h-[120px]"
              value={formData.education}
              onChange={(e) => handleInputChange("education", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 14: 社團經歷 */}
      {currentStep === 14 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Trophy className="h-5 w-5 text-primary" />
              Q14. 曾經的社團、興趣經歷
            </CardTitle>
            <CardDescription>
              這些經歷可能成為有趣的內容素材
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 跳過 2 年街舞&#10;- 演講比賽冠軍&#10;- 當過學生會長&#10;- 參加過創業競賽&#10;- 曾經是籃球校隊"
              className="min-h-[150px]"
              value={formData.clubExperience}
              onChange={(e) => handleInputChange("clubExperience", e.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {/* Step 15: 背景故事（結構化填空） */}
      {currentStep === 15 && (
        <Card className="border-amber-500/30">
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Q15. 請描述你的背景故事
            </CardTitle>
            <CardDescription>
              你的故事會成為內容的靈魂，請依照以下提示填寫（選填，但填越多 AI 分析越精準）
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 px-4 sm:px-6">
            {/* 成長經歷 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">1</span>
                成長經歷
              </label>
              <p className="text-xs text-muted-foreground">你在什麼環境下長大？家庭背景如何？小時候有什麼特別的經歷？</p>
              <Textarea
                placeholder="例如：我從小在市場長大，爸媽都是攤販。小時候常被同學看不起，但這讓我更努力證明自己..."
                className="min-h-[100px]"
                value={formData.backgroundStory.growthEnvironment}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  backgroundStory: { ...prev.backgroundStory, growthEnvironment: e.target.value }
                }))}
              />
            </div>

            {/* 轉折點 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">2</span>
                人生轉折點
              </label>
              <p className="text-xs text-muted-foreground">人生中有沒有重大的轉折點？是什麼事件讓你決定走上現在這條路？</p>
              <Textarea
                placeholder="例如：工作 3 年後覺得太安逸，決定辭職創業。那是改變我人生的關鍵決定..."
                className="min-h-[100px]"
                value={formData.backgroundStory.turningPoint}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  backgroundStory: { ...prev.backgroundStory, turningPoint: e.target.value }
                }))}
              />
            </div>

            {/* 挫折與成長 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">3</span>
                挫折與成長
              </label>
              <p className="text-xs text-muted-foreground">遇過什麼重大挫折？怎麼走過來的？這些經歷如何塑造了現在的你？</p>
              <Textarea
                placeholder="例如：第一次創業失敗負債 200 萬，當時差點放棄，但想到父母辛苦的背影，咬牙撐過來了..."
                className="min-h-[100px]"
                value={formData.backgroundStory.challenges}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  backgroundStory: { ...prev.backgroundStory, challenges: e.target.value }
                }))}
              />
            </div>

            {/* 價值觀 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">4</span>
                價值觀
              </label>
              <p className="text-xs text-muted-foreground">你最在乎什麼？什麼信念在支撐著你？</p>
              <Textarea
                placeholder="例如：我相信努力會有回報，始終沒忘記當初那個在市場幫忙叫賣的自己..."
                className="min-h-[100px]"
                value={formData.backgroundStory.values}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  backgroundStory: { ...prev.backgroundStory, values: e.target.value }
                }))}
              />
            </div>

            {/* 動機 */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium">
                <span className="bg-amber-500 text-white px-2 py-0.5 rounded text-xs">5</span>
                創業/工作動機
              </label>
              <p className="text-xs text-muted-foreground">為什麼做現在的事業？想要達成什麼目標？</p>
              <Textarea
                placeholder="例如：我想幫助更多年輕人少走彎路，把我這些年學到的經驗分享出去..."
                className="min-h-[100px]"
                value={formData.backgroundStory.motivation}
                onChange={(e) => setFormData(prev => ({
                  ...prev,
                  backgroundStory: { ...prev.backgroundStory, motivation: e.target.value }
                }))}
              />
            </div>

            <div className="bg-amber-500/10 p-4 rounded-lg">
              <p className="text-sm text-amber-700 font-medium mb-2">為什麼背景故事很重要？</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• 好的故事能讓觀眾產生情感連結，更容易記住你</li>
                <li>• 真實的經歷是最有說服力的內容素材</li>
                <li>• AI 會分析你的故事，找出最有共鳴的切入點</li>
                <li>• 這些故事可以成為你的人設記憶點和差異化優勢</li>
              </ul>
            </div>

            {/* 內容完整度提示 */}
            <div className={cn(
              "p-4 rounded-lg border-2",
              completeness.level === 'excellent' ? "bg-green-500/10 border-green-500/30" :
              completeness.level === 'good' ? "bg-blue-500/10 border-blue-500/30" :
              completeness.level === 'fair' ? "bg-yellow-500/10 border-yellow-500/30" :
              "bg-red-500/10 border-red-500/30"
            )}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium flex items-center gap-2">
                  {completeness.level === 'excellent' ? (
                    <><CheckCircle2 className="h-4 w-4 text-green-500" /> 內容非常完整！</>
                  ) : completeness.level === 'good' ? (
                    <><CheckCircle2 className="h-4 w-4 text-blue-500" /> 內容良好</>
                  ) : completeness.level === 'fair' ? (
                    <><AlertTriangle className="h-4 w-4 text-yellow-500" /> 建議補充更多內容</>
                  ) : (
                    <><AlertTriangle className="h-4 w-4 text-red-500" /> 內容較少，報告可能不夠精準</>
                  )}
                </p>
                <Badge variant={
                  completeness.level === 'excellent' ? "default" :
                  completeness.level === 'good' ? "secondary" :
                  "outline"
                }>
                  完整度 {completeness.percentage}%
                </Badge>
              </div>

              <Progress
                value={completeness.percentage}
                className={cn(
                  "h-2 mb-3",
                  completeness.level === 'excellent' ? "[&>div]:bg-green-500" :
                  completeness.level === 'good' ? "[&>div]:bg-blue-500" :
                  completeness.level === 'fair' ? "[&>div]:bg-yellow-500" :
                  "[&>div]:bg-red-500"
                )}
              />

              {completeness.level !== 'excellent' && (
                <div className="text-xs text-muted-foreground space-y-1">
                  {completeness.missingItems.length > 0 && (
                    <p>
                      <span className="font-medium text-foreground">建議填寫：</span>
                      {completeness.missingItems.join('、')}
                    </p>
                  )}
                  {completeness.weakItems.length > 0 && (
                    <p>
                      <span className="font-medium text-foreground">可以再詳細一點：</span>
                      {completeness.weakItems.join('、')}
                    </p>
                  )}
                  <p className="mt-2 text-muted-foreground/80">
                    提示：填寫越詳細，AI 分析的定位報告就越精準、越實用！
                  </p>
                </div>
              )}

              {completeness.level === 'excellent' && (
                <p className="text-xs text-green-600">
                  太棒了！你填寫的內容非常豐富，AI 可以產出高品質的定位報告。
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report View */}
      {currentStep === 16 && report && (
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

          {/* 人設定位（新版格式） */}
          {report.persona && (
            <Card className="border-purple-500/30">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-500" />
                  人設記憶點
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-4">
                <div className="bg-purple-500/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">核心人設</p>
                  <p className="font-semibold text-lg">{report.persona.coreIdentity}</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">記憶點</p>
                    <p className="font-medium">{report.persona.memoryHook}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">說話風格</p>
                    <p className="font-medium">{report.persona.toneOfVoice}</p>
                  </div>
                </div>
                {report.persona.visualStyle && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">視覺風格建議</p>
                    <p className="text-sm">{report.persona.visualStyle}</p>
                  </div>
                )}
                {report.persona.catchphrase && (
                  <div className="bg-primary/10 p-3 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-1">口頭禪</p>
                    <p className="font-medium text-primary">「{report.persona.catchphrase}」</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* 背景故事分析 */}
          {report.backgroundStoryAnalysis && (
            <Card className="border-amber-500/30">
              <CardHeader className="px-4 sm:px-6 pb-2">
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-amber-500" />
                  你的故事分析
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 sm:px-6 space-y-4">
                {/* 故事摘要 */}
                <div className="bg-amber-500/10 p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground mb-1">故事精華</p>
                  <p className="font-medium">{report.backgroundStoryAnalysis.summary}</p>
                </div>

                {/* 真實感分數 */}
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">故事感染力</span>
                  <div className="flex-1 bg-muted rounded-full h-2">
                    <div
                      className="bg-amber-500 h-2 rounded-full transition-all"
                      style={{ width: `${report.backgroundStoryAnalysis.authenticityScore}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-amber-600">
                    {report.backgroundStoryAnalysis.authenticityScore}/100
                  </span>
                </div>

                {/* 關鍵轉折點 */}
                {report.backgroundStoryAnalysis.keyMoments && report.backgroundStoryAnalysis.keyMoments.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">人生關鍵轉折點</p>
                    <div className="space-y-2">
                      {report.backgroundStoryAnalysis.keyMoments.map((moment, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-amber-500 mt-0.5">★</span>
                          <span className="text-sm">{moment}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 情感連結點 */}
                {report.backgroundStoryAnalysis.emotionalHooks && report.backgroundStoryAnalysis.emotionalHooks.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">可打動觀眾的情感點</p>
                    <div className="flex flex-wrap gap-2">
                      {report.backgroundStoryAnalysis.emotionalHooks.map((hook, i) => (
                        <Badge key={i} variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">
                          {hook}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* 內容角度 */}
                {report.backgroundStoryAnalysis.contentAngles && report.backgroundStoryAnalysis.contentAngles.length > 0 && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-2">可以拍成影片的角度</p>
                    <ul className="space-y-2">
                      {report.backgroundStoryAnalysis.contentAngles.map((angle, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="text-primary mt-0.5">{i + 1}.</span>
                          <span>{angle}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* 共鳴點 */}
                {report.backgroundStoryAnalysis.resonancePoints && report.backgroundStoryAnalysis.resonancePoints.length > 0 && (
                  <div className="bg-primary/5 p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground mb-2">最容易引起共鳴的點</p>
                    <div className="space-y-1">
                      {report.backgroundStoryAnalysis.resonancePoints.map((point, i) => (
                        <div key={i} className="flex items-start gap-2">
                          <span className="text-primary">💡</span>
                          <span className="text-sm font-medium">{point}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                  <Badge className={cn("text-lg px-4 py-1", getCompetitionColor(report.competitorAnalysis?.level || report.differentiator ? "中" : "中"))}>
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
                    {(report.painPoints || report.targetAudience?.painPoints)?.map((point, i) => (
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
                  <p className="bg-yellow-500/10 p-3 rounded-lg">
                    {report.uniqueValue || report.differentiator?.uniqueAdvantage || report.persona?.memoryHook || '—'}
                  </p>
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

              {/* 前 10 支影片建議（新版格式） */}
              {report.first10Videos && report.first10Videos.length > 0 && (
                <Card className="border-primary/30">
                  <CardHeader className="px-4 sm:px-6 pb-2">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" />
                      前 10 支影片建議
                      <Badge className="bg-primary text-[10px]">起號關鍵</Badge>
                    </CardTitle>
                    <CardDescription>
                      這是你帳號開始的前 10 支影片規劃
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 space-y-3">
                    {report.first10Videos.map((video, i) => (
                      <div key={i} className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-start gap-2">
                          <Badge className="bg-primary/20 text-primary shrink-0">{i + 1}</Badge>
                          <p className="font-semibold text-sm">{video.title}</p>
                        </div>
                        <div className="pl-7 space-y-1">
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">Hook：</span>
                            {video.hook}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            <span className="font-medium text-foreground">切入角度：</span>
                            {video.angle}
                          </p>
                          {video.resource && (
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">運用資源：</span>
                              {video.resource}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* 資源運用建議（新版格式） */}
              {report.resourceUtilization && (
                <Card>
                  <CardHeader className="px-4 sm:px-6 pb-2">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Globe className="h-5 w-5 text-emerald-500" />
                      資源運用建議
                    </CardTitle>
                    <CardDescription>
                      把你提供的資源變成內容素材
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 space-y-4">
                    {/* 場地資源 */}
                    {report.resourceUtilization.locations && report.resourceUtilization.locations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Globe className="h-4 w-4 text-emerald-500" />
                          場地資源
                        </p>
                        <div className="space-y-2">
                          {report.resourceUtilization.locations.map((loc, i) => (
                            <div key={i} className="bg-emerald-500/5 p-3 rounded-lg">
                              <p className="font-medium text-sm mb-1">{loc.resource}</p>
                              <div className="flex flex-wrap gap-1">
                                {loc.contentIdeas.map((idea, j) => (
                                  <Badge key={j} variant="outline" className="text-xs">{idea}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 互動資源 */}
                    {report.resourceUtilization.interactions && report.resourceUtilization.interactions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          互動資源
                        </p>
                        <div className="space-y-2">
                          {report.resourceUtilization.interactions.map((inter, i) => (
                            <div key={i} className="bg-blue-500/5 p-3 rounded-lg">
                              <p className="font-medium text-sm mb-1">{inter.resource}</p>
                              <div className="flex flex-wrap gap-1">
                                {inter.contentIdeas.map((idea, j) => (
                                  <Badge key={j} variant="outline" className="text-xs">{idea}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {/* 物品資源 */}
                    {report.resourceUtilization.items && report.resourceUtilization.items.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-orange-500" />
                          物品資源
                        </p>
                        <div className="space-y-2">
                          {report.resourceUtilization.items.map((item, i) => (
                            <div key={i} className="bg-orange-500/5 p-3 rounded-lg">
                              <p className="font-medium text-sm mb-1">{item.resource}</p>
                              <div className="flex flex-wrap gap-1">
                                {item.contentIdeas.map((idea, j) => (
                                  <Badge key={j} variant="outline" className="text-xs">{idea}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

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
                  {report.platformStrategy?.secondary && (
                    <div className="flex gap-2">
                      <Badge variant="outline">輔助</Badge>
                      <span>{report.platformStrategy.secondary}</span>
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">{report.platformStrategy?.reason}</p>
                  {report.platformStrategy?.postingSchedule && (
                    <div className="bg-blue-500/10 p-3 rounded-lg">
                      <p className="text-sm font-medium text-blue-600">發布建議</p>
                      <p className="text-sm">{report.platformStrategy.postingSchedule}</p>
                    </div>
                  )}
                  {report.platformStrategy?.contentMix && (
                    <div className="bg-primary/10 p-3 rounded-lg">
                      <p className="text-sm font-medium text-primary">內容比例</p>
                      <p className="text-sm">{report.platformStrategy.contentMix}</p>
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
                  <p className="text-sm">{report.competitorAnalysis?.insight || report.differentiator?.vsCompetitors}</p>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-primary">差異化切入點：</p>
                    <p className="text-sm">{report.competitorAnalysis?.differentiator || report.differentiator?.uniqueAdvantage || '—'}</p>
                  </div>
                  {report.differentiator?.avoidPitfalls && (
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <p className="text-sm font-medium text-orange-600">要避免的錯誤：</p>
                      <p className="text-sm">{report.differentiator.avoidPitfalls}</p>
                    </div>
                  )}
                  {report.competitorAnalysis?.referenceStyles && report.competitorAnalysis.referenceStyles.length > 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">可參考的內容風格：</p>
                      <ul className="space-y-1">
                        {report.competitorAnalysis.referenceStyles.map((style, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{style}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : report.competitorAnalysis?.benchmarks && report.competitorAnalysis.benchmarks.length > 0 ? (
                    <div>
                      <p className="text-sm text-muted-foreground mb-2">可參考的內容風格：</p>
                      <ul className="space-y-1">
                        {report.competitorAnalysis.benchmarks.map((b, i) => (
                          <li key={i} className="text-sm flex items-start gap-2">
                            <span className="text-primary mt-1">•</span>
                            <span>{b}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
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
                  {/* 新格式：{ week1, week2to4, month2to3 } */}
                  {report.actionPlan && !Array.isArray(report.actionPlan) && 'week1' in report.actionPlan && (
                    <div className="space-y-4">
                      {(report.actionPlan as { week1: string[]; week2to4: string[]; month2to3: string[] }).week1?.length > 0 && (
                        <div className="border rounded-lg p-3">
                          <p className="font-medium mb-2 text-green-600">第一週</p>
                          <ol className="space-y-1">
                            {(report.actionPlan as { week1: string[] }).week1.map((task, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm">
                                <span className="text-green-500">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {(report.actionPlan as { week2to4: string[] }).week2to4?.length > 0 && (
                        <div className="border rounded-lg p-3">
                          <p className="font-medium mb-2 text-blue-600">第 2-4 週</p>
                          <ol className="space-y-1">
                            {(report.actionPlan as { week2to4: string[] }).week2to4.map((task, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm">
                                <span className="text-blue-500">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                      {(report.actionPlan as { month2to3: string[] }).month2to3?.length > 0 && (
                        <div className="border rounded-lg p-3">
                          <p className="font-medium mb-2 text-purple-600">第 2-3 個月</p>
                          <ol className="space-y-1">
                            {(report.actionPlan as { month2to3: string[] }).month2to3.map((task, j) => (
                              <li key={j} className="flex items-start gap-2 text-sm">
                                <span className="text-purple-500">•</span>
                                <span>{task}</span>
                              </li>
                            ))}
                          </ol>
                        </div>
                      )}
                    </div>
                  )}
                  {/* 舊格式：string[] */}
                  {report.actionPlan && Array.isArray(report.actionPlan) && typeof report.actionPlan[0] === 'string' && (
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
                  )}
                  {/* 舊格式：{ phase, tasks }[] */}
                  {report.actionPlan && Array.isArray(report.actionPlan) && typeof report.actionPlan[0] === 'object' && 'phase' in (report.actionPlan[0] as object) && (
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
                    <CardContent className="px-4 sm:px-6 space-y-4">
                      {/* 1 個月 */}
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-green-500">1 個月</Badge>
                          <span className="font-medium text-sm">
                            {typeof report.kpis.month1 === 'string'
                              ? report.kpis.month1
                              : report.kpis.month1.target}
                          </span>
                        </div>
                        {typeof report.kpis.month1 === 'object' && (
                          <div className="space-y-1 pl-2 border-l-2 border-green-500/30">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">怎麼達成：</span>
                              {report.kpis.month1.howToAchieve}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">追蹤指標：</span>
                              {report.kpis.month1.keyMetrics}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* 3 個月 */}
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-yellow-500">3 個月</Badge>
                          <span className="font-medium text-sm">
                            {typeof report.kpis.month3 === 'string'
                              ? report.kpis.month3
                              : report.kpis.month3.target}
                          </span>
                        </div>
                        {typeof report.kpis.month3 === 'object' && (
                          <div className="space-y-1 pl-2 border-l-2 border-yellow-500/30">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">怎麼達成：</span>
                              {report.kpis.month3.howToAchieve}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">里程碑：</span>
                              {report.kpis.month3.milestone}
                            </p>
                          </div>
                        )}
                      </div>
                      {/* 6 個月 */}
                      <div className="border rounded-lg p-3 space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-blue-500">6 個月</Badge>
                          <span className="font-medium text-sm">
                            {typeof report.kpis.month6 === 'string'
                              ? report.kpis.month6
                              : report.kpis.month6.target}
                          </span>
                        </div>
                        {typeof report.kpis.month6 === 'object' && (
                          <div className="space-y-1 pl-2 border-l-2 border-blue-500/30">
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">怎麼達成：</span>
                              {report.kpis.month6.howToAchieve}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              <span className="font-medium text-foreground">收入組成：</span>
                              {report.kpis.month6.revenueBreakdown}
                            </p>
                          </div>
                        )}
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

              {/* 顧問寄語（新版格式） */}
              {report.consultantNote && (
                <Card className="border-primary bg-gradient-to-r from-primary/5 to-purple-500/5">
                  <CardHeader className="px-4 sm:px-6 pb-2">
                    <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                      <Compass className="h-5 w-5 text-primary" />
                      顧問寄語
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6">
                    <div className="bg-white/50 dark:bg-black/20 p-4 rounded-lg">
                      <p className="text-sm leading-relaxed whitespace-pre-line">{report.consultantNote}</p>
                    </div>
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
