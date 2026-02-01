"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  History,
  Star,
  Loader2,
  Eye,
  Trash2,
  Calendar,
  Target,
  FileText,
  LayoutGrid,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  User,
  Users,
  Lightbulb,
  BookOpen,
  Shield,
  Music,
  Play
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

// 生成記錄類型
interface Generation {
  id: string
  feature_type: 'positioning' | 'script' | 'carousel'
  title: string | null
  input_data: Record<string, unknown>
  output_data: Record<string, unknown>
  is_favorite: boolean
  created_at: string
  model_used: string | null
}

interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

// 類型配置
const typeConfig = {
  positioning: {
    label: '定位分析',
    icon: Target,
    color: 'from-emerald-500 to-teal-500',
    badgeColor: 'bg-emerald-100 text-emerald-700'
  },
  script: {
    label: '腳本生成',
    icon: FileText,
    color: 'from-blue-500 to-indigo-500',
    badgeColor: 'bg-blue-100 text-blue-700'
  },
  carousel: {
    label: '輪播貼文',
    icon: LayoutGrid,
    color: 'from-purple-500 to-pink-500',
    badgeColor: 'bg-purple-100 text-purple-700'
  }
}

export default function HistoryPage() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<Generation[]>([])
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<string>('all')
  const [viewingRecord, setViewingRecord] = useState<Generation | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [activeVersion, setActiveVersion] = useState(0)

  // 獲取記錄
  const fetchRecords = useCallback(async (page = 1, type?: string) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ page: String(page), limit: '10' })
      if (type && type !== 'all') {
        params.set('type', type)
      }

      const response = await fetch(`/api/generations?${params}`)
      const data = await response.json()

      if (!response.ok) {
        if (data.requireLogin) {
          setError('請先登入以查看生成記錄')
        } else {
          setError(data.error || '獲取記錄失敗')
        }
        return
      }

      setRecords(data.records || [])
      setPagination(data.pagination)
    } catch {
      setError('網路錯誤，請稍後再試')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchRecords(1, activeTab)
  }, [activeTab, fetchRecords])

  // 切換頁面
  const handlePageChange = (newPage: number) => {
    fetchRecords(newPage, activeTab)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 切換收藏
  const toggleFavorite = async (id: string, currentFavorite: boolean) => {
    setActionLoading(id)
    try {
      const response = await fetch('/api/generations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, is_favorite: !currentFavorite })
      })

      if (response.ok) {
        setRecords(prev =>
          prev.map(r => r.id === id ? { ...r, is_favorite: !currentFavorite } : r)
        )
      }
    } catch (error) {
      console.error('Toggle favorite error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // 刪除記錄
  const deleteRecord = async (id: string) => {
    if (!confirm('確定要刪除這筆記錄嗎？')) return

    setActionLoading(id)
    try {
      const response = await fetch('/api/generations', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })

      if (response.ok) {
        setRecords(prev => prev.filter(r => r.id !== id))
        if (pagination) {
          setPagination({ ...pagination, total: pagination.total - 1 })
        }
      }
    } catch (error) {
      console.error('Delete error:', error)
    } finally {
      setActionLoading(null)
    }
  }

  // 複製內容
  const copyContent = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedId(id)
      setTimeout(() => setCopiedId(null), 2000)
    } catch (error) {
      console.error('Copy error:', error)
    }
  }

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-TW', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // 渲染記錄卡片
  const renderRecordCard = (record: Generation) => {
    const config = typeConfig[record.feature_type]
    const Icon = config.icon

    return (
      <Card
        key={record.id}
        className="transition-all hover:shadow-md cursor-pointer"
        onClick={() => {
          setActiveVersion(0)
          setViewingRecord(record)
        }}
      >
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className={cn(
                "w-8 h-8 rounded-lg bg-gradient-to-br flex items-center justify-center shrink-0",
                config.color
              )}>
                <Icon className="h-4 w-4 text-white" />
              </div>
              <div className="min-w-0">
                <CardTitle className="text-sm truncate flex items-center gap-2">
                  {record.is_favorite && (
                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500 shrink-0" />
                  )}
                  {record.title || config.label}
                </CardTitle>
                <CardDescription className="text-xs flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(record.created_at)}
                </CardDescription>
              </div>
            </div>
            <Badge className={cn("shrink-0 text-xs", config.badgeColor)}>
              {config.label}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {record.feature_type === 'positioning' && record.output_data.positioningStatement ? (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {String(record.output_data.positioningStatement)}
            </p>
          ) : null}
          {record.feature_type === 'script' && record.output_data.versions ? (
            <p className="text-xs text-muted-foreground">
              {(record.output_data.versions as Array<{style?: string}>).length} 個版本
              {record.input_data.videoSettings ? ` - ${String((record.input_data.videoSettings as {topic?: string}).topic || '')}` : ''}
            </p>
          ) : null}
          {record.feature_type === 'carousel' && record.output_data.carouselPosts ? (
            <p className="text-xs text-muted-foreground">
              {(record.output_data.carouselPosts as Array<unknown>).length} 組貼文
              {record.input_data.niche ? ` - ${String(record.input_data.niche)}` : ''}
            </p>
          ) : null}

          {/* 操作按鈕 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation()
                setActiveVersion(0)
                setViewingRecord(record)
              }}
            >
              <Eye className="h-3 w-3 mr-1" />
              查看
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={(e) => {
                e.stopPropagation()
                toggleFavorite(record.id, record.is_favorite)
              }}
              disabled={actionLoading === record.id}
            >
              <Star className={cn(
                "h-3 w-3 mr-1",
                record.is_favorite && "text-yellow-500 fill-yellow-500"
              )} />
              {record.is_favorite ? '已收藏' : '收藏'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-destructive hover:text-destructive"
              onClick={(e) => {
                e.stopPropagation()
                deleteRecord(record.id)
              }}
              disabled={actionLoading === record.id}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              刪除
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  // === 彈窗渲染：定位記錄 ===
  const renderPositioningDialog = (record: Generation) => {
    const output = record.output_data as Record<string, unknown>
    const persona = output.persona as Record<string, string> | undefined
    const targetAudience = output.targetAudience as {
      who?: string; age?: string; characteristics?: string
      painPoints?: string[]; desires?: string[]
    } | undefined
    const contentPillars = output.contentPillars as Array<{
      pillar: string; ratio?: string; description?: string
      topics?: string[]; hooks?: string[]
    }> | undefined
    const backgroundStoryAnalysis = output.backgroundStoryAnalysis as {
      summary?: string; keyMoments?: string[]
      emotionalHooks?: string[]; contentAngles?: string[]
      resonancePoints?: string[]
    } | undefined
    const resourceUtilization = output.resourceUtilization as {
      locations?: Array<{ resource: string; contentIdeas?: string[] }>
      interactions?: Array<{ resource: string; contentIdeas?: string[] }>
      items?: Array<{ resource: string; contentIdeas?: string[] }>
    } | undefined
    const first10Videos = output.first10Videos as Array<{
      title?: string; hook?: string; angle?: string; resource?: string
    }> | undefined
    const differentiator = output.differentiator as {
      vsCompetitors?: string; uniqueAdvantage?: string; avoidPitfalls?: string
    } | undefined
    const personaTags = output.personaTags as string[] | undefined
    const storyAssets = output.storyAssets as {
      workExperience?: string; education?: string; otherExperience?: string
    } | undefined
    const positioningStatement = output.positioningStatement as string | undefined
    const niche = output.niche as string | undefined
    const uniqueValue = output.uniqueValue as string | undefined

    return (
      <div className="space-y-4 mt-4">
        {/* 定位宣言 */}
        {positioningStatement && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="pt-4">
              <p className="text-sm sm:text-base font-medium leading-relaxed break-words">
                「{positioningStatement}」
              </p>
            </CardContent>
          </Card>
        )}

        {/* 基本資訊 */}
        <div className="flex flex-wrap gap-2 text-sm">
          {niche && (
            <Badge variant="outline">定位：{niche}</Badge>
          )}
          {uniqueValue && (
            <Badge variant="outline">獨特價值：{uniqueValue}</Badge>
          )}
        </div>

        {/* 人設標籤 */}
        {personaTags && personaTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {personaTags.map((tag, idx) => (
              <Badge key={idx} variant="secondary" className="text-xs sm:text-sm">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Accordion type="multiple" defaultValue={["persona", "audience", "pillars"]} className="w-full">
          {/* 人設定位 */}
          {persona && (
            <AccordionItem value="persona">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  人設定位
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  {persona.coreIdentity && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">核心身分</p>
                      <p className="text-sm font-medium break-words">{persona.coreIdentity}</p>
                    </div>
                  )}
                  {persona.memoryHook && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">記憶鉤子</p>
                      <p className="text-sm font-medium break-words">{persona.memoryHook}</p>
                    </div>
                  )}
                  {persona.toneOfVoice && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">說話風格</p>
                      <p className="text-sm font-medium break-words">{persona.toneOfVoice}</p>
                    </div>
                  )}
                  {persona.visualStyle && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">視覺風格</p>
                      <p className="text-sm font-medium break-words">{persona.visualStyle}</p>
                    </div>
                  )}
                  {persona.catchphrase && (
                    <div className="p-3 rounded-lg bg-muted/50 sm:col-span-2">
                      <p className="text-xs text-muted-foreground mb-1">招牌口頭禪</p>
                      <p className="text-sm font-medium break-words">「{persona.catchphrase}」</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 目標受眾 */}
          {targetAudience && (
            <AccordionItem value="audience">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  目標受眾
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  <div className="grid gap-2 sm:grid-cols-3">
                    {targetAudience.who && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">主要族群</p>
                        <p className="text-sm font-medium break-words">{targetAudience.who}</p>
                      </div>
                    )}
                    {targetAudience.age && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">年齡層</p>
                        <p className="text-sm font-medium">{targetAudience.age}</p>
                      </div>
                    )}
                    {targetAudience.characteristics && (
                      <div className="p-3 rounded-lg bg-muted/50">
                        <p className="text-xs text-muted-foreground mb-1">特徵</p>
                        <p className="text-sm font-medium break-words">{targetAudience.characteristics}</p>
                      </div>
                    )}
                  </div>
                  {targetAudience.painPoints && targetAudience.painPoints.length > 0 && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                      <p className="text-xs text-red-600 dark:text-red-400 mb-2 font-medium">痛點</p>
                      <ul className="space-y-1">
                        {targetAudience.painPoints.map((point, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2 break-words">
                            <span className="text-red-500 mt-0.5 shrink-0">•</span>
                            {point}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {targetAudience.desires && targetAudience.desires.length > 0 && (
                    <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <p className="text-xs text-green-600 dark:text-green-400 mb-2 font-medium">渴望</p>
                      <ul className="space-y-1">
                        {targetAudience.desires.map((desire, idx) => (
                          <li key={idx} className="text-sm flex items-start gap-2 break-words">
                            <span className="text-green-500 mt-0.5 shrink-0">•</span>
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
          {contentPillars && contentPillars.length > 0 && (
            <AccordionItem value="pillars">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  內容支柱
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {contentPillars.map((pillar, idx) => (
                    <Card key={idx} className="border-l-4 border-l-primary">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                          <h4 className="font-semibold text-sm">{pillar.pillar}</h4>
                          {pillar.ratio && (
                            <Badge variant="outline" className="text-xs">{pillar.ratio}</Badge>
                          )}
                        </div>
                        {pillar.description && (
                          <p className="text-xs text-muted-foreground mb-2 break-words">{pillar.description}</p>
                        )}
                        {pillar.topics && pillar.topics.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {pillar.topics.map((topic, tidx) => (
                              <Badge key={tidx} variant="secondary" className="text-xs">
                                {topic}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 故事素材分析 */}
          {backgroundStoryAnalysis && (
            <AccordionItem value="story">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" />
                  故事素材分析
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3">
                  {backgroundStoryAnalysis.summary && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">故事摘要</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{backgroundStoryAnalysis.summary}</p>
                    </div>
                  )}
                  <div className="grid gap-3 sm:grid-cols-2">
                    {backgroundStoryAnalysis.keyMoments && backgroundStoryAnalysis.keyMoments.length > 0 && (
                      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                        <p className="text-xs text-blue-600 dark:text-blue-400 mb-2 font-medium">關鍵時刻</p>
                        <ul className="space-y-1">
                          {backgroundStoryAnalysis.keyMoments.map((moment, idx) => (
                            <li key={idx} className="text-sm break-words">• {moment}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {backgroundStoryAnalysis.emotionalHooks && backgroundStoryAnalysis.emotionalHooks.length > 0 && (
                      <div className="p-3 rounded-lg bg-pink-500/10 border border-pink-500/20">
                        <p className="text-xs text-pink-600 dark:text-pink-400 mb-2 font-medium">情感鉤子</p>
                        <ul className="space-y-1">
                          {backgroundStoryAnalysis.emotionalHooks.map((hook, idx) => (
                            <li key={idx} className="text-sm break-words">• {hook}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {backgroundStoryAnalysis.contentAngles && backgroundStoryAnalysis.contentAngles.length > 0 && (
                      <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                        <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">內容切角</p>
                        <ul className="space-y-1">
                          {backgroundStoryAnalysis.contentAngles.map((angle, idx) => (
                            <li key={idx} className="text-sm break-words">• {angle}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {backgroundStoryAnalysis.resonancePoints && backgroundStoryAnalysis.resonancePoints.length > 0 && (
                      <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-2 font-medium">共鳴點</p>
                        <ul className="space-y-1">
                          {backgroundStoryAnalysis.resonancePoints.map((point, idx) => (
                            <li key={idx} className="text-sm break-words">• {point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 故事素材庫 */}
          {storyAssets && (storyAssets.workExperience || storyAssets.education || storyAssets.otherExperience) && (
            <AccordionItem value="assets">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  故事素材庫
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {storyAssets.workExperience && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">工作經歷</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{storyAssets.workExperience}</p>
                    </div>
                  )}
                  {storyAssets.education && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">學歷背景</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{storyAssets.education}</p>
                    </div>
                  )}
                  {storyAssets.otherExperience && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">其他經歷</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{storyAssets.otherExperience}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 資源運用 */}
          {resourceUtilization && (
            <AccordionItem value="resources">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-primary" />
                  資源運用建議
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-3 sm:grid-cols-3">
                  {resourceUtilization.locations && resourceUtilization.locations.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">場景/地點</p>
                      <ul className="space-y-2">
                        {resourceUtilization.locations.map((loc, idx) => (
                          <li key={idx}>
                            <p className="text-sm font-medium break-words">{loc.resource}</p>
                            {loc.contentIdeas && loc.contentIdeas.length > 0 && (
                              <ul className="text-xs text-muted-foreground mt-1">
                                {loc.contentIdeas.map((idea, iidx) => (
                                  <li key={iidx} className="break-words">→ {idea}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {resourceUtilization.interactions && resourceUtilization.interactions.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">互動對象</p>
                      <ul className="space-y-2">
                        {resourceUtilization.interactions.map((int, idx) => (
                          <li key={idx}>
                            <p className="text-sm font-medium break-words">{int.resource}</p>
                            {int.contentIdeas && int.contentIdeas.length > 0 && (
                              <ul className="text-xs text-muted-foreground mt-1">
                                {int.contentIdeas.map((idea, iidx) => (
                                  <li key={iidx} className="break-words">→ {idea}</li>
                                ))}
                              </ul>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {resourceUtilization.items && resourceUtilization.items.length > 0 && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-2 font-medium">道具/物品</p>
                      <ul className="space-y-2">
                        {resourceUtilization.items.map((item, idx) => (
                          <li key={idx}>
                            <p className="text-sm font-medium break-words">{item.resource}</p>
                            {item.contentIdeas && item.contentIdeas.length > 0 && (
                              <ul className="text-xs text-muted-foreground mt-1">
                                {item.contentIdeas.map((idea, iidx) => (
                                  <li key={iidx} className="break-words">→ {idea}</li>
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

          {/* 前 10 支影片建議 */}
          {first10Videos && first10Videos.length > 0 && (
            <AccordionItem value="videos">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-primary" />
                  前 10 支影片建議
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  {first10Videos.map((video, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-2 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="shrink-0 mt-0.5">{idx + 1}</Badge>
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm break-words">{video.title}</p>
                        {video.hook && (
                          <p className="text-xs text-muted-foreground mt-0.5 break-words">
                            <span className="text-primary">Hook:</span> {video.hook}
                          </p>
                        )}
                        {video.angle && (
                          <p className="text-xs text-muted-foreground break-words">
                            <span className="text-primary">角度:</span> {video.angle}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}

          {/* 差異化策略 */}
          {differentiator && (
            <AccordionItem value="differentiator">
              <AccordionTrigger className="text-sm sm:text-base font-semibold">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" />
                  差異化策略
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid gap-2 sm:grid-cols-3">
                  {differentiator.vsCompetitors && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">vs 競爭者</p>
                      <p className="text-sm break-words">{differentiator.vsCompetitors}</p>
                    </div>
                  )}
                  {differentiator.uniqueAdvantage && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">獨特優勢</p>
                      <p className="text-sm break-words">{differentiator.uniqueAdvantage}</p>
                    </div>
                  )}
                  {differentiator.avoidPitfalls && (
                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">避免踩坑</p>
                      <p className="text-sm break-words">{differentiator.avoidPitfalls}</p>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {/* 操作按鈕 */}
        <div className="flex flex-wrap gap-3 pt-4 border-t">
          <Link href={`/script-generator?positioning=${record.id}`} className="flex-1">
            <Button className="w-full gap-2" size="sm">
              <FileText className="h-4 w-4" />
              用此定位生成腳本
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewingRecord(null)}
          >
            關閉
          </Button>
        </div>
      </div>
    )
  }

  // === 彈窗渲染：腳本記錄 ===
  const renderScriptDialog = (record: Generation) => {
    const versions = record.output_data.versions as Array<{
      id: string
      style: string
      styleDescription?: string
      framework?: string
      script: {
        title: string
        subtitle?: string
        totalDuration?: string
        pacing?: string
        segments: Array<{
          segmentId?: number
          segmentName?: string
          timeRange?: string
          duration?: string
          visual?: string
          voiceover?: string
          textOverlay?: string
          effect?: string
          sound?: string
          emotionalBeat?: string
        }>
        bgm?: {
          style?: string
          mood?: string
          suggestions?: string[]
        }
        cta?: string
      }
      shootingTips?: string[]
      editingTips?: string[]
      equipmentNeeded?: string[]
      alternativeHooks?: string[]
    }> | undefined

    if (!versions?.length) {
      return <p className="text-sm text-muted-foreground py-4">無腳本資料</p>
    }

    const currentVersion = versions[activeVersion] || versions[0]

    // 組合完整版本文字用於複製
    const getVersionText = (v: typeof currentVersion) => {
      let text = `【${v.style}】${v.script.title}\n`
      if (v.script.subtitle) text += `${v.script.subtitle}\n`
      text += '\n'
      v.script.segments.forEach((seg) => {
        if (seg.segmentName) text += `--- ${seg.segmentName} ---\n`
        if (seg.timeRange) text += `時間：${seg.timeRange}\n`
        if (seg.visual) text += `畫面：${seg.visual}\n`
        if (seg.voiceover) text += `口播：${seg.voiceover}\n`
        if (seg.textOverlay) text += `字卡：${seg.textOverlay}\n`
        if (seg.effect) text += `特效：${seg.effect}\n`
        if (seg.sound) text += `音效：${seg.sound}\n`
        text += '\n'
      })
      if (v.script.cta) text += `CTA：${v.script.cta}\n`
      if (v.shootingTips?.length) text += `\n拍攝建議：\n${v.shootingTips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      if (v.editingTips?.length) text += `\n剪輯建議：\n${v.editingTips.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n`
      return text
    }

    const videoSettings = record.input_data.videoSettings as {
      topic?: string; duration?: number; shootingType?: string
    } | undefined

    return (
      <div className="space-y-4 mt-4">
        {/* 影片資訊 */}
        {videoSettings && (
          <div className="flex flex-wrap gap-2 text-xs">
            {videoSettings.topic && (
              <Badge variant="outline">
                主題：{videoSettings.topic}
              </Badge>
            )}
            {videoSettings.duration && (
              <Badge variant="outline">
                {videoSettings.duration}秒
              </Badge>
            )}
            {videoSettings.shootingType && (
              <Badge variant="outline">
                {videoSettings.shootingType}
              </Badge>
            )}
          </div>
        )}

        {/* 版本 tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {versions.map((v, i) => (
            <Button
              key={i}
              variant={activeVersion === i ? "default" : "outline"}
              size="sm"
              className="shrink-0 text-xs"
              onClick={() => setActiveVersion(i)}
            >
              版本 {v.id || String.fromCharCode(65 + i)} - {v.style}
            </Button>
          ))}
        </div>

        {/* 當前版本內容 */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1 mb-1">
                  <Badge variant="secondary" className="text-xs">{currentVersion.style}</Badge>
                  {currentVersion.framework && (
                    <Badge variant="outline" className="text-xs">{currentVersion.framework}</Badge>
                  )}
                  {currentVersion.script.totalDuration && (
                    <Badge variant="outline" className="text-xs">{currentVersion.script.totalDuration}</Badge>
                  )}
                  {currentVersion.script.pacing && (
                    <Badge variant="outline" className="text-xs">節奏：{currentVersion.script.pacing}</Badge>
                  )}
                </div>
                <CardTitle className="text-base break-words">{currentVersion.script.title}</CardTitle>
                {currentVersion.script.subtitle && (
                  <CardDescription className="mt-1 break-words">{currentVersion.script.subtitle}</CardDescription>
                )}
                {currentVersion.styleDescription && (
                  <p className="text-xs text-muted-foreground mt-1 break-words">{currentVersion.styleDescription}</p>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => copyContent(getVersionText(currentVersion), `dialog-${currentVersion.id}`)}
              >
                {copiedId === `dialog-${currentVersion.id}` ? (
                  <><Check className="h-3 w-3 mr-1 text-green-500" />已複製</>
                ) : (
                  <><Copy className="h-3 w-3 mr-1" />複製</>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* 分鏡腳本 */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Play className="h-3 w-3" />
                分鏡腳本
              </h4>
              {currentVersion.script.segments.map((segment, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-muted/30 border space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className="text-xs">{segment.segmentName || `段落 ${idx + 1}`}</Badge>
                    {segment.timeRange && (
                      <Badge variant="outline" className="text-xs">{segment.timeRange}</Badge>
                    )}
                    {segment.emotionalBeat && (
                      <span className="text-xs text-muted-foreground">{segment.emotionalBeat}</span>
                    )}
                  </div>
                  {segment.visual && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">畫面</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{segment.visual}</p>
                    </div>
                  )}
                  {segment.voiceover && (
                    <div className="p-2 rounded bg-primary/5 border border-primary/20">
                      <p className="text-xs text-primary mb-0.5 font-medium">口播</p>
                      <p className="text-sm break-words whitespace-pre-wrap">{segment.voiceover}</p>
                    </div>
                  )}
                  {segment.textOverlay && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">字卡</p>
                      <p className="text-sm break-words">{segment.textOverlay}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {segment.effect && <span>特效：{segment.effect}</span>}
                    {segment.sound && <span>音效：{segment.sound}</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* BGM 建議 */}
            {currentVersion.script.bgm && (
              <div className="p-3 rounded-lg bg-muted/30 border">
                <h4 className="text-sm font-semibold flex items-center gap-2 mb-2">
                  <Music className="h-3 w-3" />
                  BGM 建議
                </h4>
                <div className="flex flex-wrap gap-2 text-xs">
                  {currentVersion.script.bgm.style && (
                    <Badge variant="secondary">{currentVersion.script.bgm.style}</Badge>
                  )}
                  {currentVersion.script.bgm.mood && (
                    <Badge variant="outline">{currentVersion.script.bgm.mood}</Badge>
                  )}
                  {currentVersion.script.bgm.suggestions?.map((s, i) => (
                    <Badge key={i} variant="outline">{s}</Badge>
                  ))}
                </div>
              </div>
            )}

            {/* CTA */}
            {currentVersion.script.cta && (
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-xs text-primary mb-0.5 font-medium">結尾 CTA</p>
                <p className="text-sm break-words">{currentVersion.script.cta}</p>
              </div>
            )}

            {/* 拍攝 & 剪輯建議 */}
            {(currentVersion.shootingTips?.length || currentVersion.editingTips?.length) && (
              <Accordion type="multiple" className="w-full">
                {currentVersion.shootingTips && currentVersion.shootingTips.length > 0 && (
                  <AccordionItem value="shooting">
                    <AccordionTrigger className="text-sm font-semibold py-2">拍攝建議</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {currentVersion.shootingTips.map((tip, i) => (
                          <li key={i} className="text-sm break-words">{i + 1}. {tip}</li>
                        ))}
                      </ul>
                      {currentVersion.equipmentNeeded && currentVersion.equipmentNeeded.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">需要器材</p>
                          <div className="flex flex-wrap gap-1">
                            {currentVersion.equipmentNeeded.map((eq, i) => (
                              <Badge key={i} variant="outline" className="text-xs">{eq}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                )}
                {currentVersion.editingTips && currentVersion.editingTips.length > 0 && (
                  <AccordionItem value="editing">
                    <AccordionTrigger className="text-sm font-semibold py-2">剪輯建議</AccordionTrigger>
                    <AccordionContent>
                      <ul className="space-y-1">
                        {currentVersion.editingTips.map((tip, i) => (
                          <li key={i} className="text-sm break-words">{i + 1}. {tip}</li>
                        ))}
                      </ul>
                    </AccordionContent>
                  </AccordionItem>
                )}
              </Accordion>
            )}

            {/* 備選 HOOK */}
            {currentVersion.alternativeHooks && currentVersion.alternativeHooks.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1 font-medium">備選開場 HOOK</p>
                <ul className="space-y-1">
                  {currentVersion.alternativeHooks.map((hook, i) => (
                    <li key={i} className="text-sm break-words">{i + 1}. {hook}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 底部按鈕 */}
        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setViewingRecord(null)}>
            關閉
          </Button>
        </div>
      </div>
    )
  }

  // === 彈窗渲染：輪播記錄 ===
  const renderCarouselDialog = (record: Generation) => {
    const posts = record.output_data.carouselPosts as Array<{
      id: number
      title: string
      caption: string
      slides: Array<{ headline: string; body: string }>
    }> | undefined

    if (!posts?.length) {
      return <p className="text-sm text-muted-foreground py-4">無輪播資料</p>
    }

    return (
      <div className="space-y-4 mt-4">
        {posts.map((post, postIdx) => (
          <Card key={postIdx}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <CardTitle className="text-sm break-words">{post.title}</CardTitle>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="shrink-0"
                  onClick={() => {
                    const content = post.slides.map(s => `${s.headline}\n${s.body}`).join('\n\n')
                    copyContent(`${content}\n\n${post.caption}`, `dialog-carousel-${post.id}`)
                  }}
                >
                  {copiedId === `dialog-carousel-${post.id}` ? (
                    <><Check className="h-3 w-3 mr-1 text-green-500" />已複製</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" />複製</>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Slides */}
              <div className="space-y-2">
                {post.slides.map((slide, slideIdx) => (
                  <div key={slideIdx} className="p-3 rounded-lg bg-muted/30 border">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="text-xs">第 {slideIdx + 1} 頁</Badge>
                    </div>
                    <p className="text-sm font-medium break-words">{slide.headline}</p>
                    <p className="text-sm text-muted-foreground mt-1 break-words whitespace-pre-wrap">{slide.body}</p>
                  </div>
                ))}
              </div>

              {/* Caption */}
              {post.caption && (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs text-primary mb-0.5 font-medium">Caption</p>
                  <p className="text-sm break-words whitespace-pre-wrap">{post.caption}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => setViewingRecord(null)}>
            關閉
          </Button>
        </div>
      </div>
    )
  }

  // 取得 Dialog 標題
  const getDialogTitle = (record: Generation) => {
    const config = typeConfig[record.feature_type]
    const Icon = config.icon
    return (
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-6 h-6 rounded-md bg-gradient-to-br flex items-center justify-center shrink-0",
          config.color
        )}>
          <Icon className="h-3 w-3 text-white" />
        </div>
        <span className="truncate">{record.title || config.label}</span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      {/* Header */}
      <div className="flex items-center gap-3 sm:gap-4">
        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
          <History className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
            生成記錄
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            查看過去 AI 生成的所有內容
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">全部</TabsTrigger>
          <TabsTrigger value="positioning">定位</TabsTrigger>
          <TabsTrigger value="script">腳本</TabsTrigger>
          <TabsTrigger value="carousel">輪播</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
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
                  onClick={() => fetchRecords(1, activeTab)}
                >
                  重試
                </Button>
              </CardContent>
            </Card>
          ) : records.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <History className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-medium mb-2">還沒有生成記錄</h3>
                <p className="text-muted-foreground mb-6">
                  Pro 和買斷版用戶的生成內容會自動保存在這裡
                </p>
                <div className="flex gap-2 justify-center">
                  <Link href="/positioning">
                    <Button variant="outline">開始定位分析</Button>
                  </Link>
                  <Link href="/script-generator">
                    <Button>生成腳本</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {records.map(renderRecordCard)}
              </div>

              {/* 分頁 */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {pagination.page} / {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 完整內容 Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {viewingRecord && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base sm:text-lg">
                  {getDialogTitle(viewingRecord)}
                </DialogTitle>
                <p className="text-xs sm:text-sm text-muted-foreground flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {formatDate(viewingRecord.created_at)}
                </p>
              </DialogHeader>

              {viewingRecord.feature_type === 'positioning' && renderPositioningDialog(viewingRecord)}
              {viewingRecord.feature_type === 'script' && renderScriptDialog(viewingRecord)}
              {viewingRecord.feature_type === 'carousel' && renderCarouselDialog(viewingRecord)}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
