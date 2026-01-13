"use client"

import { AlertCircle, ArrowRight } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface CreditsAlertProps {
  message?: string
  featureType?: 'script' | 'carousel'
}

export function CreditsAlert({ message, featureType = 'script' }: CreditsAlertProps) {
  const defaultMessage = featureType === 'script'
    ? '本月腳本生成額度已用完'
    : '本月輪播貼文額度已用完'

  return (
    <Alert variant="destructive" className="border-red-500/50 bg-red-500/10">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>額度不足</AlertTitle>
      <AlertDescription className="flex flex-col sm:flex-row sm:items-center gap-3 mt-2">
        <span>{message || defaultMessage}</span>
        <Link href="/pricing">
          <Button size="sm" variant="outline" className="border-red-500/50 hover:bg-red-500/10">
            升級方案
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </AlertDescription>
    </Alert>
  )
}
