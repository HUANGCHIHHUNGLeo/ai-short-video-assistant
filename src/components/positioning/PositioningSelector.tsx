"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Target, History, ChevronRight, Star, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

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
  }
  is_favorite: boolean
  created_at: string
}

// 選擇的定位數據（給其他功能使用）
export interface SelectedPositioning {
  id: string
  niche: string
  expertise: string
  targetAudience: string
  audiencePainPoints: string
  contentStyle: string
  platforms: string[]
  positioningStatement: string
  contentPillars: string[]
  personaTags: string[]
}

interface PositioningSelectorProps {
  onSelect: (positioning: SelectedPositioning | null) => void
  selectedId?: string | null
  className?: string
}

export function PositioningSelector({ onSelect, selectedId, className }: PositioningSelectorProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [records, setRecords] = useState<PositioningRecord[]>([])
  const [error, setError] = useState<string | null>(null)

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

  // 打開對話框時載入資料
  useEffect(() => {
    if (open) {
      fetchRecords()
    }
  }, [open])

  // 選擇定位記錄
  const handleSelect = (record: PositioningRecord) => {
    const positioning: SelectedPositioning = {
      id: record.id,
      niche: record.output_data.niche || record.input_data.expertise || '',
      expertise: record.input_data.expertise || '',
      targetAudience: record.output_data.targetAudience?.who || record.input_data.targetAudience || '',
      audiencePainPoints: record.input_data.painPoints || '',
      contentStyle: record.input_data.contentStyle || 'mixed',
      platforms: record.input_data.platforms || [],
      positioningStatement: record.output_data.positioningStatement || '',
      contentPillars: record.output_data.contentPillars?.map(p => p.pillar) || [],
      personaTags: record.output_data.personaTags || []
    }

    onSelect(positioning)
    setOpen(false)
  }

  // 清除選擇
  const handleClear = () => {
    onSelect(null)
    setOpen(false)
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

  // 找到當前選中的記錄
  const selectedRecord = records.find(r => r.id === selectedId)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between h-auto py-3",
            selectedId && "border-primary",
            className
          )}
        >
          <div className="flex items-center gap-2 text-left">
            <Target className="h-4 w-4 text-primary shrink-0" />
            <div className="min-w-0">
              {selectedRecord ? (
                <>
                  <div className="font-medium truncate">
                    {selectedRecord.output_data.niche || '我的定位'}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {selectedRecord.output_data.positioningStatement?.slice(0, 30)}...
                  </div>
                </>
              ) : (
                <>
                  <div className="font-medium">選擇過去的定位分析</div>
                  <div className="text-xs text-muted-foreground">
                    自動帶入定位資料，無需重新填寫
                  </div>
                </>
              )}
            </div>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            選擇定位記錄
          </DialogTitle>
          <DialogDescription>
            選擇過去的 AI 定位分析結果，自動帶入創作者背景資料
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">載入中...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">{error}</p>
              <Button
                variant="link"
                className="mt-2"
                onClick={fetchRecords}
              >
                重試
              </Button>
            </div>
          ) : records.length === 0 ? (
            <div className="text-center py-8">
              <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">還沒有定位記錄</p>
              <p className="text-sm text-muted-foreground mt-1">
                先完成 AI 定位分析，結果會自動保存
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={() => {
                  setOpen(false)
                  window.location.href = '/positioning'
                }}
              >
                前往定位分析
              </Button>
            </div>
          ) : (
            <>
              {selectedId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mb-3 text-muted-foreground"
                  onClick={handleClear}
                >
                  清除選擇，手動填寫
                </Button>
              )}

              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-3">
                  {records.map((record) => (
                    <Card
                      key={record.id}
                      className={cn(
                        "cursor-pointer transition-colors hover:border-primary/50",
                        record.id === selectedId && "border-primary bg-primary/5"
                      )}
                      onClick={() => handleSelect(record)}
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
                            <CardDescription className="text-xs mt-1">
                              {formatDate(record.created_at)}
                            </CardDescription>
                          </div>
                          {record.id === selectedId && (
                            <Badge variant="default" className="shrink-0">
                              已選擇
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        {record.output_data.positioningStatement && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {record.output_data.positioningStatement}
                          </p>
                        )}
                        {record.output_data.personaTags && record.output_data.personaTags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {record.output_data.personaTags.slice(0, 4).map((tag, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {record.output_data.personaTags.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{record.output_data.personaTags.length - 4}
                              </Badge>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
