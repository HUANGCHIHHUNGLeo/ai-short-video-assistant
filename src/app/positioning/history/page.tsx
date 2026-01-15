"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ArrowLeft,
  Target,
  History,
  Star,
  Loader2,
  Eye,
  Trash2,
  Calendar,
  Users,
  TrendingUp
} from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"

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
  }
  output_data: {
    positioningStatement?: string
    niche?: string
    targetAudience?: {
      who?: string
      age?: string
    }
    contentPillars?: Array<{
      pillar: string
      description: string
    }>
    personaTags?: string[]
    confidence?: number
  }
  is_favorite: boolean
  created_at: string
}

export default function PositioningHistoryPage() {
  const [loading, setLoading] = useState(true)
  const [records, setRecords] = useState<PositioningRecord[]>([])
  const [error, setError] = useState<string | null>(null)
  const [selectedRecord, setSelectedRecord] = useState<PositioningRecord | null>(null)

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
                selectedRecord?.id === record.id && "border-primary ring-2 ring-primary/20"
              )}
              onClick={() => setSelectedRecord(selectedRecord?.id === record.id ? null : record)}
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

                {/* 展開詳情 */}
                {selectedRecord?.id === record.id && (
                  <div className="pt-3 border-t space-y-3 animate-in fade-in slide-in-from-top-2">
                    {/* 輸入資料 */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground mb-2">問卷資料</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {record.input_data.expertise && (
                          <div>
                            <span className="text-muted-foreground">專長：</span>
                            <span className="ml-1">{record.input_data.expertise}</span>
                          </div>
                        )}
                        {record.input_data.targetAudience && (
                          <div>
                            <span className="text-muted-foreground">受眾：</span>
                            <span className="ml-1">{record.input_data.targetAudience}</span>
                          </div>
                        )}
                        {record.input_data.monetization && (
                          <div>
                            <span className="text-muted-foreground">變現：</span>
                            <span className="ml-1">{record.input_data.monetization}</span>
                          </div>
                        )}
                        {record.input_data.platforms && record.input_data.platforms.length > 0 && (
                          <div>
                            <span className="text-muted-foreground">平台：</span>
                            <span className="ml-1">{record.input_data.platforms.join('、')}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 內容支柱 */}
                    {record.output_data.contentPillars && record.output_data.contentPillars.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground mb-2">內容支柱</h4>
                        <div className="space-y-1">
                          {record.output_data.contentPillars.slice(0, 3).map((pillar, idx) => (
                            <div key={idx} className="text-xs">
                              <span className="font-medium">{pillar.pillar}</span>
                              <span className="text-muted-foreground ml-1">- {pillar.description}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 操作按鈕 */}
                    <div className="flex gap-2 pt-2">
                      <Link href={`/script-generator?positioning=${record.id}`} className="flex-1">
                        <Button size="sm" className="w-full gap-1">
                          <TrendingUp className="h-3 w-3" />
                          用此定位生成腳本
                        </Button>
                      </Link>
                    </div>
                  </div>
                )}
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
    </div>
  )
}
