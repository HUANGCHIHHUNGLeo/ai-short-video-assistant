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
  Compass
} from "lucide-react"
import { useState } from "react"
import { useCredits } from "@/hooks/useCredits"
import { CreditsAlert } from "@/components/billing"
import { cn } from "@/lib/utils"

// 問卷資料類型
interface QuestionnaireData {
  expertise: string
  experience: string
  targetAudience: string
  painPoints: string
  customInput: string
}

// 定位報告類型
interface PositioningReport {
  positioningStatement: string
  niche: string
  targetAudience: {
    who: string
    age: string
    characteristics: string
  }
  painPoints: string[]
  uniqueValue: string
  contentPillars: {
    pillar: string
    description: string
    examples: string[]
  }[]
  personaTags: string[]
  platformStrategy: {
    primary: string
    secondary: string
    reason: string
  }
  competitorAnalysis: {
    level: string
    insight: string
    differentiator: string
  }
  actionPlan: string[]
  warnings: string[]
  confidence: number
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
  "設計/創意"
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
  "特定產業從業者"
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
  "健康/體態問題"
]

export default function PositioningPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [isGenerating, setIsGenerating] = useState(false)
  const [creditError, setCreditError] = useState<string | null>(null)
  const [report, setReport] = useState<PositioningReport | null>(null)

  const [formData, setFormData] = useState<QuestionnaireData>({
    expertise: "",
    experience: "",
    targetAudience: "",
    painPoints: "",
    customInput: ""
  })

  const { canUseFeature, useCredit, display } = useCredits()

  const totalSteps = 4

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
      case 1: return formData.expertise.trim() !== ""
      case 2: return formData.experience.trim() !== ""
      case 3: return formData.targetAudience.trim() !== ""
      case 4: return formData.painPoints.trim() !== ""
      default: return false
    }
  }

  const handleGenerate = async () => {
    // 檢查額度
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
        setCurrentStep(5) // 進入報告頁
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
      targetAudience: "",
      painPoints: "",
      customInput: ""
    })
    setReport(null)
    setCurrentStep(1)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  // 信心分數顏色
  const getConfidenceColor = (score: number) => {
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  // 競爭程度顏色
  const getCompetitionColor = (level: string) => {
    if (level === "低") return "bg-green-500/10 text-green-600"
    if (level === "中") return "bg-yellow-500/10 text-yellow-600"
    if (level === "高") return "bg-orange-500/10 text-orange-600"
    return "bg-red-500/10 text-red-600"
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
          <Compass className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            AI 定位教練
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            找到你的自媒體定位起點
            <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
              剩餘 {display.script}
            </span>
          </p>
        </div>
      </div>

      {/* Progress */}
      {currentStep <= totalSteps && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>步驟 {currentStep} / {totalSteps}</span>
            <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
          </div>
          <Progress value={(currentStep / totalSteps) * 100} className="h-2" />
        </div>
      )}

      {/* Step Content */}
      {currentStep === 1 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Target className="h-5 w-5 text-primary" />
              你的專長領域是什麼？
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

      {currentStep === 2 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Lightbulb className="h-5 w-5 text-primary" />
              你有什麼獨特經歷或成就？
            </CardTitle>
            <CardDescription>
              這是你與眾不同的關鍵，越具體越好
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 sm:px-6">
            <Textarea
              placeholder="例如：&#10;- 曾在3個月內減重15公斤&#10;- 5年電商創業經驗，營收破千萬&#10;- 教過200+學生學會英文會話&#10;- 從月薪3萬到年薪百萬的轉職經歷"
              className="min-h-[150px] sm:min-h-[200px]"
              value={formData.experience}
              onChange={(e) => handleInputChange("experience", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              提示：想想別人常來問你什麼問題？你解決過什麼困難？
            </p>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Users className="h-5 w-5 text-primary" />
              你想幫助誰？
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
                placeholder="例如：想轉職的30歲工程師、剛生完小孩的新手媽媽..."
                value={audienceOptions.includes(formData.targetAudience) ? "" : formData.targetAudience}
                onChange={(e) => handleInputChange("targetAudience", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              他們面臨什麼痛點？
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
            <div className="space-y-2">
              <Label>其他補充（選填）</Label>
              <Textarea
                placeholder="任何你想補充的資訊，例如：你的目標、想經營的平台、可投入的時間..."
                className="min-h-[80px]"
                value={formData.customInput}
                onChange={(e) => handleInputChange("customInput", e.target.value)}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Report View */}
      {currentStep === 5 && report && (
        <div className="space-y-4 sm:space-y-6">
          {/* 定位宣言 */}
          <Card className="border-primary/50 bg-gradient-to-r from-primary/5 to-emerald-500/5">
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="text-center space-y-3">
                <Badge className="bg-primary">你的定位</Badge>
                <h2 className="text-xl sm:text-2xl font-bold">{report.positioningStatement}</h2>
                <p className="text-muted-foreground">細分領域：{report.niche}</p>
                <div className="flex justify-center gap-2 flex-wrap">
                  {report.personaTags.map((tag, i) => (
                    <Badge key={i} variant="outline">#{tag}</Badge>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(report.positioningStatement)}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  複製定位
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 信心分數 */}
          <Card>
            <CardContent className="pt-6 px-4 sm:px-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">定位可行性評分</p>
                  <p className={cn("text-3xl font-bold", getConfidenceColor(report.confidence))}>
                    {report.confidence}/100
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">競爭程度</p>
                  <Badge className={getCompetitionColor(report.competitorAnalysis.level)}>
                    {report.competitorAnalysis.level}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          <ScrollArea className="h-auto">
            <div className="space-y-4 sm:space-y-6">
              {/* 目標受眾 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    目標受眾
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">誰？</p>
                    <p className="font-medium">{report.targetAudience.who}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">年齡層</p>
                    <p className="font-medium">{report.targetAudience.age}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">關鍵特徵</p>
                    <p className="font-medium">{report.targetAudience.characteristics}</p>
                  </div>
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
                    {report.painPoints.map((point, i) => (
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

              {/* 內容支柱 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    內容方向建議
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-4">
                  {report.contentPillars.map((pillar, i) => (
                    <div key={i} className="border rounded-lg p-3 space-y-2">
                      <p className="font-semibold">{pillar.pillar}</p>
                      <p className="text-sm text-muted-foreground">{pillar.description}</p>
                      <div className="flex flex-wrap gap-1">
                        {pillar.examples.map((ex, j) => (
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
                    <span className="font-medium">{report.platformStrategy.primary}</span>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">輔助</Badge>
                    <span>{report.platformStrategy.secondary}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{report.platformStrategy.reason}</p>
                </CardContent>
              </Card>

              {/* 競爭分析 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg">競爭分析</CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6 space-y-3">
                  <p className="text-sm">{report.competitorAnalysis.insight}</p>
                  <div className="bg-primary/5 p-3 rounded-lg">
                    <p className="text-sm font-medium text-primary">差異化切入點：</p>
                    <p className="text-sm">{report.competitorAnalysis.differentiator}</p>
                  </div>
                </CardContent>
              </Card>

              {/* 行動計畫 */}
              <Card>
                <CardHeader className="px-4 sm:px-6 pb-2">
                  <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    下一步行動
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 sm:px-6">
                  <ol className="space-y-2">
                    {report.actionPlan.map((action, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500 text-white text-sm flex items-center justify-center">
                          {i + 1}
                        </span>
                        <span>{action}</span>
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>

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

          {/* 重新開始按鈕 */}
          <Button variant="outline" className="w-full" onClick={handleReset}>
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
                  AI 正在分析...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  生成定位報告
                </>
              )}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
