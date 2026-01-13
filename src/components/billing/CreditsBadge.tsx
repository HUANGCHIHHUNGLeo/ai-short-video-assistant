"use client"

import { useCredits } from '@/hooks/useCredits'
import { cn } from '@/lib/utils'
import { Zap, Infinity as InfinityIcon, AlertCircle } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Link from 'next/link'

interface CreditsBadgeProps {
  className?: string
  showDetails?: boolean
}

export function CreditsBadge({ className, showDetails = false }: CreditsBadgeProps) {
  const { credits, isLoading, display } = useCredits()

  if (isLoading || !credits) {
    return (
      <div className={cn("animate-pulse bg-muted rounded-lg h-10 w-24", className)} />
    )
  }

  const isUnlimited = credits.scriptLimit === -1
  const scriptRemaining = isUnlimited ? Number.POSITIVE_INFINITY : credits.scriptLimit - credits.scriptUsed
  const carouselRemaining = isUnlimited ? Number.POSITIVE_INFINITY : credits.carouselLimit - credits.carouselUsed
  const isLow = !isUnlimited && (scriptRemaining <= 2 || carouselRemaining <= 1)

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link href="/pricing">
          <div
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg border transition-all cursor-pointer",
              isUnlimited
                ? "bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 hover:border-amber-500/50"
                : isLow
                  ? "bg-red-500/10 border-red-500/30 hover:border-red-500/50"
                  : "bg-primary/5 border-primary/20 hover:border-primary/40",
              className
            )}
          >
            {isUnlimited ? (
              <InfinityIcon className="h-4 w-4 text-amber-500" />
            ) : isLow ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : (
              <Zap className="h-4 w-4 text-primary" />
            )}
            <div className="flex flex-col text-xs leading-tight">
              <span className={cn(
                "font-medium",
                isUnlimited ? "text-amber-600" : isLow ? "text-red-600" : "text-foreground"
              )}>
                {isUnlimited ? '無限' : `${scriptRemaining + carouselRemaining} 次`}
              </span>
              {showDetails && !isUnlimited && (
                <span className="text-muted-foreground text-[10px]">
                  腳本{display.script} / 輪播{display.carousel}
                </span>
              )}
            </div>
          </div>
        </Link>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="max-w-xs">
        <div className="space-y-2 p-1">
          <p className="font-medium">剩餘額度</p>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="text-muted-foreground">腳本生成：</span>
              <span className={cn(
                "font-medium ml-1",
                !isUnlimited && scriptRemaining <= 2 ? "text-red-500" : ""
              )}>
                {display.script}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">輪播貼文：</span>
              <span className={cn(
                "font-medium ml-1",
                !isUnlimited && carouselRemaining <= 1 ? "text-red-500" : ""
              )}>
                {display.carousel}
              </span>
            </div>
          </div>
          {!isUnlimited && (
            <p className="text-xs text-muted-foreground border-t pt-2 mt-2">
              {isLow ? '額度即將用完，點擊升級' : '點擊查看升級方案'}
            </p>
          )}
          {isUnlimited && (
            <p className="text-xs text-amber-600 border-t pt-2 mt-2">
              買斷版 - 無限使用
            </p>
          )}
        </div>
      </TooltipContent>
    </Tooltip>
  )
}
