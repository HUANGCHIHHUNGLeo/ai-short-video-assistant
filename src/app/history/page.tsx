"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Check
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
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

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
    const isExpanded = expandedId === record.id

    return (
      <Card
        key={record.id}
        className={cn(
          "transition-all",
          isExpanded && "ring-2 ring-primary/20"
        )}
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
          {/* 快速預覽 */}
          {record.feature_type === 'positioning' && record.output_data.positioningStatement && (
            <p className="text-xs text-muted-foreground line-clamp-2">
              {String(record.output_data.positioningStatement)}
            </p>
          )}
          {record.feature_type === 'script' && record.output_data.versions && (
            <p className="text-xs text-muted-foreground">
              {(record.output_data.versions as Array<{style?: string}>).length} 個版本
              {record.input_data.videoSettings && ` - ${String((record.input_data.videoSettings as {topic?: string}).topic || '')}`}
            </p>
          )}
          {record.feature_type === 'carousel' && record.output_data.carouselPosts && (
            <p className="text-xs text-muted-foreground">
              {(record.output_data.carouselPosts as Array<unknown>).length} 組貼文
              {record.input_data.niche && ` - ${String(record.input_data.niche)}`}
            </p>
          )}

          {/* 操作按鈕 */}
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setExpandedId(isExpanded ? null : record.id)}
            >
              <Eye className="h-3 w-3 mr-1" />
              {isExpanded ? '收起' : '查看'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => toggleFavorite(record.id, record.is_favorite)}
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
              onClick={() => deleteRecord(record.id)}
              disabled={actionLoading === record.id}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              刪除
            </Button>
          </div>

          {/* 展開詳情 */}
          {isExpanded && (
            <div className="pt-3 border-t space-y-3 animate-in fade-in slide-in-from-top-2">
              {renderExpandedContent(record)}
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  // 渲染展開內容
  const renderExpandedContent = (record: Generation) => {
    if (record.feature_type === 'positioning') {
      const output = record.output_data
      return (
        <div className="space-y-3">
          {output.niche && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">定位：</span>
              <span className="text-sm ml-1">{String(output.niche)}</span>
            </div>
          )}
          {output.positioningStatement && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">定位宣言：</span>
              <p className="text-sm mt-1">{String(output.positioningStatement)}</p>
            </div>
          )}
          {output.contentPillars && (
            <div>
              <span className="text-xs font-medium text-muted-foreground">內容支柱：</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {(output.contentPillars as Array<{pillar: string}>).map((p, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">{p.pillar}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2">
            <Link href={`/script-generator?positioning=${record.id}`}>
              <Button size="sm" className="h-8">用此定位生成腳本</Button>
            </Link>
          </div>
        </div>
      )
    }

    if (record.feature_type === 'script') {
      const versions = record.output_data.versions as Array<{
        id: string
        style: string
        script: { title: string; segments: Array<{voiceover?: string}> }
      }> | undefined

      if (!versions?.length) return <p className="text-sm text-muted-foreground">無腳本資料</p>

      return (
        <div className="space-y-3">
          {versions.slice(0, 3).map((v, i) => (
            <div key={i} className="p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{v.style} - {v.script.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    const content = v.script.segments.map(s => s.voiceover || '').join('\n')
                    copyContent(content, `${record.id}-${v.id}`)
                  }}
                >
                  {copiedId === `${record.id}-${v.id}` ? (
                    <><Check className="h-3 w-3 mr-1 text-green-500" />已複製</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" />複製</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (record.feature_type === 'carousel') {
      const posts = record.output_data.carouselPosts as Array<{
        id: number
        title: string
        caption: string
        slides: Array<{headline: string; body: string}>
      }> | undefined

      if (!posts?.length) return <p className="text-sm text-muted-foreground">無輪播資料</p>

      return (
        <div className="space-y-3">
          {posts.slice(0, 3).map((post, i) => (
            <div key={i} className="p-2 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium">{post.title}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2"
                  onClick={() => {
                    const content = post.slides.map(s => `${s.headline}\n${s.body}`).join('\n\n')
                    copyContent(`${content}\n\n${post.caption}`, `${record.id}-${post.id}`)
                  }}
                >
                  {copiedId === `${record.id}-${post.id}` ? (
                    <><Check className="h-3 w-3 mr-1 text-green-500" />已複製</>
                  ) : (
                    <><Copy className="h-3 w-3 mr-1" />複製</>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{post.caption}</p>
            </div>
          ))}
        </div>
      )
    }

    return null
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
    </div>
  )
}
