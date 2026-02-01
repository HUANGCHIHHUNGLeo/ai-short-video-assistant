"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import {
  ArrowLeft,
  Target,
  History,
  Star,
  Loader2,
  Calendar,
  Users,
  TrendingUp,
  User,
  Lightbulb,
  MapPin,
  BookOpen,
  Video,
  Shield,
  MessageSquare,
  Megaphone,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Download,
  FileText
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 完整的定位報告輸出類型（對應 /api/positioning 的輸出）
interface PositioningOutputData {
  positioningStatement?: string
  niche?: string
  uniqueValue?: string
  persona?: {
    coreIdentity?: string
    memoryHook?: string
    toneOfVoice?: string
    visualStyle?: string
    catchphrase?: string
  }
  targetAudience?: {
    who?: string
    age?: string
    characteristics?: string
    painPoints?: string[]
    desires?: string[]
  }
  contentPillars?: Array<{
    pillar: string
    ratio?: string
    description?: string
    topics?: string[]
    hooks?: string[]
  }>
  resourceUtilization?: {
    locations?: Array<{ resource: string; contentIdeas?: string[] }>
    interactions?: Array<{ resource: string; contentIdeas?: string[] }>
    items?: Array<{ resource: string; contentIdeas?: string[] }>
  }
  storyAssets?: {
    workExperience?: string
    education?: string
    otherExperience?: string
  }
  backgroundStoryAnalysis?: {
    summary?: string
    keyMoments?: string[]
    emotionalHooks?: string[]
    contentAngles?: string[]
    resonancePoints?: string[]
    authenticityScore?: number
  }
  first10Videos?: Array<{
    title?: string
    hook?: string
    angle?: string
    resource?: string
  }>
  platformStrategy?: {
    primary?: string
    reason?: string
    postingSchedule?: string
    contentMix?: string
  }
  differentiator?: {
    vsCompetitors?: string
    uniqueAdvantage?: string
    avoidPitfalls?: string
  }
  actionPlan?: {
    week1?: string[]
    week2to4?: string[]
    month2to3?: string[]
  }
  warnings?: string[]
  opportunities?: string[]
  personalBrand?: {
    tone?: string
  }
  personaTags?: string[]
  consultantNote?: string
  confidence?: number
  confidenceReason?: string
}

// 定位記錄類型
interface PositioningRecord {
  id: string
  title: string | null
  input_data: {
    expertise?: string
    targetAudience?: string
    painPoints?: string
    monetization?: string
    contentStyle?: string
    platforms?: string[]
    goals?: string
    backgroundStory?: string
    resources?: string
  }
  output_data: PositioningOutputData
  is_favorite: boolean
  created_at: string
}

export default function PositioningHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<PositioningRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [viewingReport, setViewingReport] = useState<PositioningRecord | null>(null)
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  // 獲取定位記錄
  const fetchRecords = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/positioning/history')
      const data = await response.json()

      if (!response.ok) {
        if (data.requireLogin) {
          setError('請先登入以查看定位記錄')
        } else {
          setError(data.error || '獲取記錄失敗')
        }
        return
      }

      setRecords(data.records || [])
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecords()
  }, [])

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 獲取信心分數顏色
  const getConfidenceColor = (score?: number) => {
    if (!score) return "text-muted-foreground"
    if (score >= 80) return "text-green-500"
    if (score >= 60) return "text-yellow-500"
    return "text-red-500"
  }

  // 生成 PDF 內容並下載
  const exportToPdf = async (record: PositioningRecord) => {
    setIsExportingPdf(true)

    try {
      const output = record.output_data
      const date = formatDate(record.created_at)

      // 建立 PDF 內容的 HTML
      const pdfContent = `
<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <title>定位分析報告 - ${output.niche || '我的定位'}</title>
  <style>
    @page { margin: 20mm; size: A4; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft JhengHei", sans-serif;
      line-height: 1.6;
      color: #333;
      background: #fff;
      padding: 20px;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #6366f1;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 { font-size: 28px; color: #6366f1; margin-bottom: 8px; }
    .header .date { color: #666; font-size: 14px; }
    .header .niche { font-size: 18px; color: #333; margin-top: 10px; }

    .statement {
      background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      margin-bottom: 30px;
      font-size: 18px;
      font-weight: 500;
      text-align: center;
    }

    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 30px;
      justify-content: center;
    }
    .tag {
      background: #f3f4f6;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 13px;
      color: #4b5563;
    }

    .section {
      margin-bottom: 30px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #6366f1;
      border-left: 4px solid #6366f1;
      padding-left: 12px;
      margin-bottom: 16px;
    }

    .grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
    .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .card {
      background: #f9fafb;
      border-radius: 8px;
      padding: 12px;
    }
    .card-label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
    .card-value { font-size: 14px; font-weight: 500; }

    .list { margin-left: 20px; }
    .list li { margin-bottom: 6px; font-size: 14px; }

    .pillar {
      border-left: 4px solid #6366f1;
      background: #f9fafb;
      padding: 16px;
      margin-bottom: 12px;
      border-radius: 0 8px 8px 0;
    }
    .pillar-title { font-weight: 600; font-size: 16px; }
    .pillar-ratio { font-size: 12px; color: #6b7280; margin-left: 8px; }
    .pillar-desc { font-size: 14px; color: #4b5563; margin-top: 8px; }
    .pillar-topics { margin-top: 8px; }
    .topic-tag {
      display: inline-block;
      background: #e0e7ff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin: 2px;
      color: #4338ca;
    }

    .video-item {
      background: #f9fafb;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    .video-num {
      display: inline-block;
      background: #6366f1;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      text-align: center;
      line-height: 24px;
      font-size: 12px;
      font-weight: 600;
      margin-right: 8px;
    }
    .video-title { font-weight: 500; font-size: 14px; }
    .video-detail { font-size: 12px; color: #6b7280; margin-top: 4px; }

    .highlight-box {
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 12px;
    }
    .highlight-green { background: #dcfce7; border: 1px solid #86efac; }
    .highlight-red { background: #fee2e2; border: 1px solid #fca5a5; }
    .highlight-blue { background: #dbeafe; border: 1px solid #93c5fd; }
    .highlight-purple { background: #f3e8ff; border: 1px solid #c4b5fd; }
    .highlight-amber { background: #fef3c7; border: 1px solid #fcd34d; }
    .highlight-pink { background: #fce7f3; border: 1px solid #f9a8d4; }

    .highlight-title { font-size: 12px; font-weight: 600; margin-bottom: 6px; }
    .highlight-title.green { color: #16a34a; }
    .highlight-title.red { color: #dc2626; }
    .highlight-title.blue { color: #2563eb; }
    .highlight-title.purple { color: #7c3aed; }
    .highlight-title.amber { color: #d97706; }
    .highlight-title.pink { color: #db2777; }

    .confidence {
      background: #f9fafb;
      padding: 16px;
      border-radius: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
    }
    .confidence-label { font-weight: 500; }
    .confidence-score {
      font-size: 24px;
      font-weight: 700;
      padding: 4px 16px;
      border-radius: 8px;
    }
    .score-high { background: #dcfce7; color: #16a34a; }
    .score-medium { background: #fef3c7; color: #d97706; }
    .score-low { background: #fee2e2; color: #dc2626; }

    .footer {
      margin-top: 40px;
      text-align: center;
      color: #9ca3af;
      font-size: 12px;
      border-top: 1px solid #e5e7eb;
      padding-top: 20px;
    }

    @media print {
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>AI 定位分析報告</h1>
    <div class="niche">${output.niche || record.title || '我的定位'}</div>
    <div class="date">${date}</div>
  </div>

  ${output.positioningStatement ? `
  <div class="statement">「${output.positioningStatement}」</div>
  ` : ''}

  ${output.personaTags && output.personaTags.length > 0 ? `
  <div class="tags">
    ${output.personaTags.map(tag => `<span class="tag">${tag}</span>`).join('')}
  </div>
  ` : ''}

  ${output.persona ? `
  <div class="section">
    <div class="section-title">人設定位</div>
    <div class="grid">
      ${output.persona.coreIdentity ? `<div class="card"><div class="card-label">核心身分</div><div class="card-value">${output.persona.coreIdentity}</div></div>` : ''}
      ${output.persona.memoryHook ? `<div class="card"><div class="card-label">記憶鉤子</div><div class="card-value">${output.persona.memoryHook}</div></div>` : ''}
      ${output.persona.toneOfVoice ? `<div class="card"><div class="card-label">說話風格</div><div class="card-value">${output.persona.toneOfVoice}</div></div>` : ''}
      ${output.persona.visualStyle ? `<div class="card"><div class="card-label">視覺風格</div><div class="card-value">${output.persona.visualStyle}</div></div>` : ''}
    </div>
    ${output.persona.catchphrase ? `<div class="card" style="margin-top: 12px;"><div class="card-label">招牌口頭禪</div><div class="card-value">「${output.persona.catchphrase}」</div></div>` : ''}
  </div>
  ` : ''}

  ${output.targetAudience ? `
  <div class="section">
    <div class="section-title">目標受眾</div>
    <div class="grid-3">
      ${output.targetAudience.who ? `<div class="card"><div class="card-label">主要族群</div><div class="card-value">${output.targetAudience.who}</div></div>` : ''}
      ${output.targetAudience.age ? `<div class="card"><div class="card-label">年齡層</div><div class="card-value">${output.targetAudience.age}</div></div>` : ''}
      ${output.targetAudience.characteristics ? `<div class="card"><div class="card-label">特徵</div><div class="card-value">${output.targetAudience.characteristics}</div></div>` : ''}
    </div>
    <div class="grid" style="margin-top: 12px;">
      ${output.targetAudience.painPoints && output.targetAudience.painPoints.length > 0 ? `
      <div class="highlight-box highlight-red">
        <div class="highlight-title red">痛點</div>
        <ul class="list">${output.targetAudience.painPoints.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.targetAudience.desires && output.targetAudience.desires.length > 0 ? `
      <div class="highlight-box highlight-green">
        <div class="highlight-title green">渴望</div>
        <ul class="list">${output.targetAudience.desires.map(d => `<li>${d}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${output.contentPillars && output.contentPillars.length > 0 ? `
  <div class="section">
    <div class="section-title">內容支柱</div>
    ${output.contentPillars.map(pillar => `
    <div class="pillar">
      <div><span class="pillar-title">${pillar.pillar}</span>${pillar.ratio ? `<span class="pillar-ratio">(${pillar.ratio})</span>` : ''}</div>
      ${pillar.description ? `<div class="pillar-desc">${pillar.description}</div>` : ''}
      ${pillar.topics && pillar.topics.length > 0 ? `
      <div class="pillar-topics">
        ${pillar.topics.map(t => `<span class="topic-tag">${t}</span>`).join('')}
      </div>
      ` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${output.backgroundStoryAnalysis ? `
  <div class="section">
    <div class="section-title">故事素材分析</div>
    ${output.backgroundStoryAnalysis.summary ? `
    <div class="card" style="margin-bottom: 12px;">
      <div class="card-label">故事摘要</div>
      <div class="card-value">${output.backgroundStoryAnalysis.summary}</div>
    </div>
    ` : ''}
    <div class="grid">
      ${output.backgroundStoryAnalysis.keyMoments && output.backgroundStoryAnalysis.keyMoments.length > 0 ? `
      <div class="highlight-box highlight-blue">
        <div class="highlight-title blue">關鍵時刻</div>
        <ul class="list">${output.backgroundStoryAnalysis.keyMoments.map(m => `<li>${m}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.backgroundStoryAnalysis.emotionalHooks && output.backgroundStoryAnalysis.emotionalHooks.length > 0 ? `
      <div class="highlight-box highlight-pink">
        <div class="highlight-title pink">情感鉤子</div>
        <ul class="list">${output.backgroundStoryAnalysis.emotionalHooks.map(h => `<li>${h}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.backgroundStoryAnalysis.contentAngles && output.backgroundStoryAnalysis.contentAngles.length > 0 ? `
      <div class="highlight-box highlight-purple">
        <div class="highlight-title purple">內容切角</div>
        <ul class="list">${output.backgroundStoryAnalysis.contentAngles.map(a => `<li>${a}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.backgroundStoryAnalysis.resonancePoints && output.backgroundStoryAnalysis.resonancePoints.length > 0 ? `
      <div class="highlight-box highlight-amber">
        <div class="highlight-title amber">共鳴點</div>
        <ul class="list">${output.backgroundStoryAnalysis.resonancePoints.map(p => `<li>${p}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${output.first10Videos && output.first10Videos.length > 0 ? `
  <div class="section">
    <div class="section-title">前 10 支影片建議</div>
    ${output.first10Videos.map((video, idx) => `
    <div class="video-item">
      <span class="video-num">${idx + 1}</span>
      <span class="video-title">${video.title || ''}</span>
      ${video.hook ? `<div class="video-detail">Hook: ${video.hook}</div>` : ''}
      ${video.angle ? `<div class="video-detail">角度: ${video.angle}</div>` : ''}
    </div>
    `).join('')}
  </div>
  ` : ''}

  ${output.differentiator ? `
  <div class="section">
    <div class="section-title">差異化策略</div>
    <div class="grid-3">
      ${output.differentiator.vsCompetitors ? `<div class="card"><div class="card-label">vs 競爭者</div><div class="card-value">${output.differentiator.vsCompetitors}</div></div>` : ''}
      ${output.differentiator.uniqueAdvantage ? `<div class="card"><div class="card-label">獨特優勢</div><div class="card-value">${output.differentiator.uniqueAdvantage}</div></div>` : ''}
      ${output.differentiator.avoidPitfalls ? `<div class="card"><div class="card-label">避免踩坑</div><div class="card-value">${output.differentiator.avoidPitfalls}</div></div>` : ''}
    </div>
  </div>
  ` : ''}

  ${output.platformStrategy ? `
  <div class="section">
    <div class="section-title">平台策略</div>
    <div class="grid">
      ${output.platformStrategy.primary ? `<div class="card"><div class="card-label">主力平台</div><div class="card-value">${output.platformStrategy.primary}</div></div>` : ''}
      ${output.platformStrategy.reason ? `<div class="card"><div class="card-label">選擇原因</div><div class="card-value">${output.platformStrategy.reason}</div></div>` : ''}
      ${output.platformStrategy.postingSchedule ? `<div class="card"><div class="card-label">發布頻率</div><div class="card-value">${output.platformStrategy.postingSchedule}</div></div>` : ''}
      ${output.platformStrategy.contentMix ? `<div class="card"><div class="card-label">內容比例</div><div class="card-value">${output.platformStrategy.contentMix}</div></div>` : ''}
    </div>
  </div>
  ` : ''}

  ${output.actionPlan ? `
  <div class="section">
    <div class="section-title">行動計劃</div>
    <div class="grid-3">
      ${output.actionPlan.week1 && output.actionPlan.week1.length > 0 ? `
      <div class="highlight-box highlight-green">
        <div class="highlight-title green">第 1 週</div>
        <ul class="list">${output.actionPlan.week1.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.actionPlan.week2to4 && output.actionPlan.week2to4.length > 0 ? `
      <div class="highlight-box highlight-blue">
        <div class="highlight-title blue">第 2-4 週</div>
        <ul class="list">${output.actionPlan.week2to4.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.actionPlan.month2to3 && output.actionPlan.month2to3.length > 0 ? `
      <div class="highlight-box highlight-purple">
        <div class="highlight-title purple">第 2-3 個月</div>
        <ul class="list">${output.actionPlan.month2to3.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${(output.opportunities && output.opportunities.length > 0) || (output.warnings && output.warnings.length > 0) ? `
  <div class="section">
    <div class="section-title">機會與風險</div>
    <div class="grid">
      ${output.opportunities && output.opportunities.length > 0 ? `
      <div class="highlight-box highlight-green">
        <div class="highlight-title green">機會</div>
        <ul class="list">${output.opportunities.map(o => `<li>${o}</li>`).join('')}</ul>
      </div>
      ` : ''}
      ${output.warnings && output.warnings.length > 0 ? `
      <div class="highlight-box highlight-amber">
        <div class="highlight-title amber">風險</div>
        <ul class="list">${output.warnings.map(w => `<li>${w}</li>`).join('')}</ul>
      </div>
      ` : ''}
    </div>
  </div>
  ` : ''}

  ${output.consultantNote ? `
  <div class="section">
    <div class="section-title">顧問筆記</div>
    <div class="highlight-box highlight-purple">
      <div style="white-space: pre-wrap; font-size: 14px;">${output.consultantNote}</div>
    </div>
  </div>
  ` : ''}

  ${output.confidence ? `
  <div class="confidence">
    <div>
      <div class="confidence-label">定位信心分數</div>
      ${output.confidenceReason ? `<div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${output.confidenceReason}</div>` : ''}
    </div>
    <div class="confidence-score ${output.confidence >= 80 ? 'score-high' : output.confidence >= 60 ? 'score-medium' : 'score-low'}">
      ${output.confidence}分
    </div>
  </div>
  ` : ''}

  <div class="footer">
    <p>此報告由 AI 短影音定位分析工具生成</p>
    <p>生成時間：${date}</p>
  </div>
</body>
</html>
      `

      // 建立新視窗並列印
      const printWindow = window.open('', '_blank')
      if (printWindow) {
        printWindow.document.write(pdfContent)
        printWindow.document.close()

        // 等待內容載入後列印
        printWindow.onload = () => {
          setTimeout(() => {
            printWindow.print()
            // 列印後關閉視窗
            printWindow.onafterprint = () => {
              printWindow.close()
            }
          }, 250)
        }
      } else {
        alert('無法開啟列印視窗，請確認瀏覽器允許開啟新視窗')
      }
    } catch (error) {
      console.error('Export PDF error:', error)
      alert('匯出 PDF 時發生錯誤')
    } finally {
      setIsExportingPdf(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <Link href="/positioning">
          <Button variant="ghost" size="icon" className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-md flex-shrink-0">
          <History className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            定位分析記錄
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            查看過去的 AI 定位分析結果
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">載入中...</span>
        </div>
      ) : error ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchRecords}
            >
              重試
            </Button>
          </CardContent>
        </Card>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium mb-2">還沒有定位記錄</h3>
            <p className="text-muted-foreground mb-6">
              完成 AI 定位分析後，結果會自動保存在這裡
            </p>
            <Link href="/positioning">
              <Button>
                開始定位分析
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {records.map((record) => (
            <Card
              key={record.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
                viewingReport?.id === record.id && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setViewingReport(record)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-base truncate flex items-center gap-2">
                      {record.is_favorite && (
                        <Star className="h-4 w-4 text-yellow-500 fill-yellow-500 shrink-0" />
                      )}
                      {record.output_data.niche || record.title || '我的定位'}
                    </CardTitle>
                    <CardDescription className="text-xs mt-1 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(record.created_at)}
                    </CardDescription>
                  </div>
                  {record.output_data.confidence && (
                    <Badge
                      variant="outline"
                      className={cn("shrink-0", getConfidenceColor(record.output_data.confidence))}
                    >
                      {record.output_data.confidence}分
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="pt-0 space-y-3">
                {record.output_data.positioningStatement && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {record.output_data.positioningStatement}
                  </p>
                )}

                {/* 快速資訊 */}
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {record.output_data.targetAudience?.who && (
                    <div className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      <span className="truncate max-w-[120px]">
                        {record.output_data.targetAudience.who}
                      </span>
                    </div>
                  )}
                </div>

                {/* 標籤 */}
                {record.output_data.personaTags && record.output_data.personaTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {record.output_data.personaTags.slice(0, 3).map((tag, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {record.output_data.personaTags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{record.output_data.personaTags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                {/* 操作按鈕（直接顯示） */}
                <div className="flex gap-2 pt-2 border-t">
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      exportToPdf(record)
                    }}
                    disabled={isExportingPdf}
                  >
                    <Download className="h-3 w-3" />
                    PDF
                  </Button>
                  <Link href={`/script-generator?positioning=${record.id}`} className="flex-1" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" className="w-full gap-1">
                      <TrendingUp className="h-3 w-3" />
                      生成腳本
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 提示 */}
      {records.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground text-center">
              點擊卡片查看詳情，可直接用過去的定位來生成腳本或選題
            </p>
          </CardContent>
        </Card>
      )}

      {/* 完整報告 Dialog */}
      <Dialog open={!!viewingReport} onOpenChange={(open) => !open && setViewingReport(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Target className="h-5 w-5 text-primary" />
              {viewingReport?.output_data.niche || viewingReport?.title || '完整定位報告'}
            </DialogTitle>
            {viewingReport?.created_at && (
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {formatDate(viewingReport.created_at)}
              </p>
            )}
          </DialogHeader>

          {viewingReport && (
            <div className="space-y-4 mt-4">
              {/* 定位宣言 */}
              {viewingReport.output_data.positioningStatement && (
                <Card className="border-primary/30 bg-primary/5">
                  <CardContent className="pt-4">
                    <p className="text-base sm:text-lg font-medium leading-relaxed">
                      「{viewingReport.output_data.positioningStatement}」
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* 人設標籤 */}
              {viewingReport.output_data.personaTags && viewingReport.output_data.personaTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {viewingReport.output_data.personaTags.map((tag, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Accordion type="multiple" defaultValue={["persona", "audience", "pillars"]} className="w-full">
                {/* 人設定位 */}
                {viewingReport.output_data.persona && (
                  <AccordionItem value="persona">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        人設定位
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {viewingReport.output_data.persona.coreIdentity && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">核心身分</p>
                            <p className="text-sm font-medium">{viewingReport.output_data.persona.coreIdentity}</p>
                          </div>
                        )}
                        {viewingReport.output_data.persona.memoryHook && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">記憶鉤子</p>
                            <p className="text-sm font-medium">{viewingReport.output_data.persona.memoryHook}</p>
                          </div>
                        )}
                        {viewingReport.output_data.persona.toneOfVoice && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">說話風格</p>
                            <p className="text-sm font-medium">{viewingReport.output_data.persona.toneOfVoice}</p>
                          </div>
                        )}
                        {viewingReport.output_data.persona.visualStyle && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">視覺風格</p>
                            <p className="text-sm font-medium">{viewingReport.output_data.persona.visualStyle}</p>
                          </div>
                        )}
                        {viewingReport.output_data.persona.catchphrase && (
                          <div className="p-3 rounded-lg bg-muted/50 sm:col-span-2">
                            <p className="text-xs text-muted-foreground mb-1">招牌口頭禪</p>
                            <p className="text-sm font-medium">「{viewingReport.output_data.persona.catchphrase}」</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 目標受眾 */}
                {viewingReport.output_data.targetAudience && (
                  <AccordionItem value="audience">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        目標受眾
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        <div className="grid gap-3 sm:grid-cols-3">
                          {viewingReport.output_data.targetAudience.who && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">主要族群</p>
                              <p className="text-sm font-medium">{viewingReport.output_data.targetAudience.who}</p>
                            </div>
                          )}
                          {viewingReport.output_data.targetAudience.age && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">年齡層</p>
                              <p className="text-sm font-medium">{viewingReport.output_data.targetAudience.age}</p>
                            </div>
                          )}
                          {viewingReport.output_data.targetAudience.characteristics && (
                            <div className="p-3 rounded-lg bg-muted/50">
                              <p className="text-xs text-muted-foreground mb-1">特徵</p>
                              <p className="text-sm font-medium">{viewingReport.output_data.targetAudience.characteristics}</p>
                            </div>
                          )}
                        </div>
                        {viewingReport.output_data.targetAudience.painPoints && viewingReport.output_data.targetAudience.painPoints.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">痛點</p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.targetAudience.painPoints.map((point, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-red-500 mt-1">•</span>
                                  {point}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingReport.output_data.targetAudience.desires && viewingReport.output_data.targetAudience.desires.length > 0 && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">渴望</p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.targetAudience.desires.map((desire, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-green-500 mt-1">•</span>
                                  {desire}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 內容支柱 */}
                {viewingReport.output_data.contentPillars && viewingReport.output_data.contentPillars.length > 0 && (
                  <AccordionItem value="pillars">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-primary" />
                        內容支柱
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {viewingReport.output_data.contentPillars.map((pillar, idx) => (
                          <Card key={idx} className="border-l-4 border-l-primary">
                            <CardContent className="pt-4">
                              <div className="flex items-center justify-between mb-2">
                                <h4 className="font-semibold">{pillar.pillar}</h4>
                                {pillar.ratio && (
                                  <Badge variant="outline">{pillar.ratio}</Badge>
                                )}
                              </div>
                              {pillar.description && (
                                <p className="text-sm text-muted-foreground mb-3">{pillar.description}</p>
                              )}
                              {pillar.topics && pillar.topics.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs text-muted-foreground mb-1">主題方向</p>
                                  <div className="flex flex-wrap gap-1">
                                    {pillar.topics.map((topic, tidx) => (
                                      <Badge key={tidx} variant="secondary" className="text-xs">
                                        {topic}
                                      </Badge>
                                    ))}
                                  </div>
                                </div>
                              )}
                              {pillar.hooks && pillar.hooks.length > 0 && (
                                <div>
                                  <p className="text-xs text-muted-foreground mb-1">開場鉤子</p>
                                  <ul className="text-sm space-y-1">
                                    {pillar.hooks.map((hook, hidx) => (
                                      <li key={hidx} className="text-muted-foreground">• {hook}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 資源運用 */}
                {viewingReport.output_data.resourceUtilization && (
                  <AccordionItem value="resources">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        資源運用建議
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {viewingReport.output_data.resourceUtilization.locations && viewingReport.output_data.resourceUtilization.locations.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">場景/地點</p>
                            <ul className="space-y-2">
                              {viewingReport.output_data.resourceUtilization.locations.map((loc, idx) => (
                                <li key={idx}>
                                  <p className="text-sm font-medium">{loc.resource}</p>
                                  {loc.contentIdeas && loc.contentIdeas.length > 0 && (
                                    <ul className="text-xs text-muted-foreground mt-1">
                                      {loc.contentIdeas.map((idea, iidx) => (
                                        <li key={iidx}>→ {idea}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingReport.output_data.resourceUtilization.interactions && viewingReport.output_data.resourceUtilization.interactions.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">互動對象</p>
                            <ul className="space-y-2">
                              {viewingReport.output_data.resourceUtilization.interactions.map((int, idx) => (
                                <li key={idx}>
                                  <p className="text-sm font-medium">{int.resource}</p>
                                  {int.contentIdeas && int.contentIdeas.length > 0 && (
                                    <ul className="text-xs text-muted-foreground mt-1">
                                      {int.contentIdeas.map((idea, iidx) => (
                                        <li key={iidx}>→ {idea}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingReport.output_data.resourceUtilization.items && viewingReport.output_data.resourceUtilization.items.length > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-2 font-medium">道具/物品</p>
                            <ul className="space-y-2">
                              {viewingReport.output_data.resourceUtilization.items.map((item, idx) => (
                                <li key={idx}>
                                  <p className="text-sm font-medium">{item.resource}</p>
                                  {item.contentIdeas && item.contentIdeas.length > 0 && (
                                    <ul className="text-xs text-muted-foreground mt-1">
                                      {item.contentIdeas.map((idea, iidx) => (
                                        <li key={iidx}>→ {idea}</li>
                                      ))}
                                    </ul>
                                  )}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 故事素材分析 */}
                {viewingReport.output_data.backgroundStoryAnalysis && (
                  <AccordionItem value="story">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <BookOpen className="h-4 w-4 text-primary" />
                        故事素材分析
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {viewingReport.output_data.backgroundStoryAnalysis.summary && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">故事摘要</p>
                            <p className="text-sm">{viewingReport.output_data.backgroundStoryAnalysis.summary}</p>
                          </div>
                        )}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {viewingReport.output_data.backgroundStoryAnalysis.keyMoments && viewingReport.output_data.backgroundStoryAnalysis.keyMoments.length > 0 && (
                            <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                              <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">關鍵時刻</p>
                              <ul className="space-y-1">
                                {viewingReport.output_data.backgroundStoryAnalysis.keyMoments.map((moment, idx) => (
                                  <li key={idx} className="text-sm">• {moment}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {viewingReport.output_data.backgroundStoryAnalysis.emotionalHooks && viewingReport.output_data.backgroundStoryAnalysis.emotionalHooks.length > 0 && (
                            <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                              <p className="text-xs text-pink-600 dark:text-pink-400 mb-2 font-medium">情感鉤子</p>
                              <ul className="space-y-1">
                                {viewingReport.output_data.backgroundStoryAnalysis.emotionalHooks.map((hook, idx) => (
                                  <li key={idx} className="text-sm">• {hook}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {viewingReport.output_data.backgroundStoryAnalysis.contentAngles && viewingReport.output_data.backgroundStoryAnalysis.contentAngles.length > 0 && (
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">內容切角</p>
                              <ul className="space-y-1">
                                {viewingReport.output_data.backgroundStoryAnalysis.contentAngles.map((angle, idx) => (
                                  <li key={idx} className="text-sm">• {angle}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {viewingReport.output_data.backgroundStoryAnalysis.resonancePoints && viewingReport.output_data.backgroundStoryAnalysis.resonancePoints.length > 0 && (
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                              <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">共鳴點</p>
                              <ul className="space-y-1">
                                {viewingReport.output_data.backgroundStoryAnalysis.resonancePoints.map((point, idx) => (
                                  <li key={idx} className="text-sm">• {point}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 前 10 支影片建議 */}
                {viewingReport.output_data.first10Videos && viewingReport.output_data.first10Videos.length > 0 && (
                  <AccordionItem value="videos">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Video className="h-4 w-4 text-primary" />
                        前 10 支影片建議
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        {viewingReport.output_data.first10Videos.map((video, idx) => (
                          <Card key={idx}>
                            <CardContent className="pt-3 pb-3">
                              <div className="flex items-start gap-3">
                                <Badge variant="outline" className="shrink-0">
                                  {idx + 1}
                                </Badge>
                                <div className="min-w-0 flex-1">
                                  <p className="font-medium text-sm">{video.title}</p>
                                  {video.hook && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      <span className="text-primary">Hook:</span> {video.hook}
                                    </p>
                                  )}
                                  {video.angle && (
                                    <p className="text-xs text-muted-foreground">
                                      <span className="text-primary">角度:</span> {video.angle}
                                    </p>
                                  )}
                                  {video.resource && (
                                    <p className="text-xs text-muted-foreground">
                                      <span className="text-primary">資源:</span> {video.resource}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 差異化策略 */}
                {viewingReport.output_data.differentiator && (
                  <AccordionItem value="differentiator">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-primary" />
                        差異化策略
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {viewingReport.output_data.differentiator.vsCompetitors && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">vs 競爭者</p>
                            <p className="text-sm">{viewingReport.output_data.differentiator.vsCompetitors}</p>
                          </div>
                        )}
                        {viewingReport.output_data.differentiator.uniqueAdvantage && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">獨特優勢</p>
                            <p className="text-sm">{viewingReport.output_data.differentiator.uniqueAdvantage}</p>
                          </div>
                        )}
                        {viewingReport.output_data.differentiator.avoidPitfalls && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">避免踩坑</p>
                            <p className="text-sm">{viewingReport.output_data.differentiator.avoidPitfalls}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 平台策略 */}
                {viewingReport.output_data.platformStrategy && (
                  <AccordionItem value="platform">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-primary" />
                        平台策略
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {viewingReport.output_data.platformStrategy.primary && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">主力平台</p>
                            <p className="text-sm font-medium">{viewingReport.output_data.platformStrategy.primary}</p>
                          </div>
                        )}
                        {viewingReport.output_data.platformStrategy.reason && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">選擇原因</p>
                            <p className="text-sm">{viewingReport.output_data.platformStrategy.reason}</p>
                          </div>
                        )}
                        {viewingReport.output_data.platformStrategy.postingSchedule && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">發布頻率</p>
                            <p className="text-sm">{viewingReport.output_data.platformStrategy.postingSchedule}</p>
                          </div>
                        )}
                        {viewingReport.output_data.platformStrategy.contentMix && (
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-xs text-muted-foreground mb-1">內容比例</p>
                            <p className="text-sm">{viewingReport.output_data.platformStrategy.contentMix}</p>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 行動計劃 */}
                {viewingReport.output_data.actionPlan && (
                  <AccordionItem value="action">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-primary" />
                        行動計劃
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3">
                        {viewingReport.output_data.actionPlan.week1 && viewingReport.output_data.actionPlan.week1.length > 0 && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">第 1 週</p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.actionPlan.week1.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-green-500">✓</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingReport.output_data.actionPlan.week2to4 && viewingReport.output_data.actionPlan.week2to4.length > 0 && (
                          <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                            <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">第 2-4 週</p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.actionPlan.week2to4.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-blue-500">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingReport.output_data.actionPlan.month2to3 && viewingReport.output_data.actionPlan.month2to3.length > 0 && (
                          <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                            <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">第 2-3 個月</p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.actionPlan.month2to3.map((item, idx) => (
                                <li key={idx} className="text-sm flex items-start gap-2">
                                  <span className="text-purple-500">•</span>
                                  {item}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 機會與風險 */}
                {(viewingReport.output_data.opportunities?.length || viewingReport.output_data.warnings?.length) && (
                  <AccordionItem value="risks">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-primary" />
                        機會與風險
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="grid gap-3 sm:grid-cols-2">
                        {viewingReport.output_data.opportunities && viewingReport.output_data.opportunities.length > 0 && (
                          <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                            <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium flex items-center gap-1">
                              <Sparkles className="h-3 w-3" />
                              機會
                            </p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.opportunities.map((opp, idx) => (
                                <li key={idx} className="text-sm">• {opp}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {viewingReport.output_data.warnings && viewingReport.output_data.warnings.length > 0 && (
                          <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                            <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              風險
                            </p>
                            <ul className="space-y-1">
                              {viewingReport.output_data.warnings.map((warn, idx) => (
                                <li key={idx} className="text-sm">• {warn}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}

                {/* 顧問筆記 */}
                {viewingReport.output_data.consultantNote && (
                  <AccordionItem value="note">
                    <AccordionTrigger className="text-base font-semibold">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" />
                        顧問筆記
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                        <p className="text-sm whitespace-pre-wrap">{viewingReport.output_data.consultantNote}</p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>

              {/* 信心分數 */}
              {viewingReport.output_data.confidence && (
                <div className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">定位信心分數</p>
                    {viewingReport.output_data.confidenceReason && (
                      <p className="text-xs text-muted-foreground mt-1">{viewingReport.output_data.confidenceReason}</p>
                    )}
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-lg font-bold px-3 py-1",
                      viewingReport.output_data.confidence >= 80 ? "text-green-500 border-green-500" :
                      viewingReport.output_data.confidence >= 60 ? "text-yellow-500 border-yellow-500" :
                      "text-red-500 border-red-500"
                    )}
                  >
                    {viewingReport.output_data.confidence}分
                  </Badge>
                </div>
              )}

              {/* 操作按鈕 */}
              <div className="flex flex-wrap gap-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="gap-2"
                  onClick={() => exportToPdf(viewingReport)}
                  disabled={isExportingPdf}
                >
                  {isExportingPdf ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileText className="h-4 w-4" />
                  )}
                  {isExportingPdf ? '準備中...' : '匯出 PDF'}
                </Button>
                <Link href={`/script-generator?positioning=${viewingReport.id}`} className="flex-1">
                  <Button className="w-full gap-2">
                    <TrendingUp className="h-4 w-4" />
                    用此定位生成腳本
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={() => setViewingReport(null)}
                >
                  關閉
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
