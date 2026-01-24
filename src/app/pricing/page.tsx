"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Check, Zap, Crown, Infinity, Sparkles } from "lucide-react"
import { useCredits } from "@/hooks/useCredits"
import { PLANS, SubscriptionTier } from "@/lib/credits"
import { cn } from "@/lib/utils"

const planIcons: Record<SubscriptionTier, React.ReactNode> = {
  free: <Zap className="h-6 w-6" />,
  creator: <Sparkles className="h-6 w-6" />,
  pro: <Crown className="h-6 w-6" />,
  lifetime: <Infinity className="h-6 w-6" />,
}

const planColors: Record<SubscriptionTier, string> = {
  free: "from-gray-500 to-gray-600",
  creator: "from-blue-500 to-cyan-500",
  pro: "from-purple-500 to-pink-500",
  lifetime: "from-amber-500 to-orange-500",
}

export default function PricingPage() {
  const { credits, upgrade } = useCredits()
  const currentTier = credits?.tier || 'free'

  const handleUpgrade = async (tier: SubscriptionTier) => {
    // 暫時直接升級（未來接 Stripe）
    if (tier === 'free') return

    // 模擬付款成功
    const confirmed = window.confirm(
      tier === 'lifetime'
        ? `確定要購買買斷版（$${PLANS[tier].lifetimePrice}）嗎？\n\n（目前為測試模式，點擊確定將直接升級）`
        : `確定要升級到${PLANS[tier].name}（$${PLANS[tier].monthlyPrice}/月）嗎？\n\n（目前為測試模式，點擊確定將直接升級）`
    )

    if (confirmed) {
      try {
        await upgrade(tier)
        alert(`已升級到 ${PLANS[tier].name}！頁面將重新整理。`)
        window.location.reload()
      } catch (error) {
        console.error('Upgrade failed:', error)
        alert(`升級失敗：${error instanceof Error ? error.message : '請稍後再試'}`)
      }
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl md:text-4xl font-bold">選擇適合你的方案</h1>
        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
          無論你是剛起步的創作者，還是需要大量內容的專業團隊，我們都有適合你的方案
        </p>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(Object.entries(PLANS) as [SubscriptionTier, typeof PLANS[SubscriptionTier]][]).map(([tier, plan]) => {
          const isCurrentPlan = currentTier === tier
          const isPopular = tier === 'pro'
          const isLifetime = tier === 'lifetime'

          return (
            <Card
              key={tier}
              className={cn(
                "relative flex flex-col transition-all duration-300",
                isCurrentPlan && "ring-2 ring-primary",
                isPopular && "border-purple-500/50 shadow-lg shadow-purple-500/10",
                isLifetime && "border-amber-500/50 shadow-lg shadow-amber-500/10"
              )}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-purple-500 hover:bg-purple-600">
                  最受歡迎
                </Badge>
              )}
              {isLifetime && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 hover:bg-amber-600">
                  最划算
                </Badge>
              )}

              <CardHeader className="text-center pb-2">
                <div className={cn(
                  "w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center text-white bg-gradient-to-br",
                  planColors[tier]
                )}>
                  {planIcons[tier]}
                </div>
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                <CardDescription>{plan.nameEn}</CardDescription>
              </CardHeader>

              <CardContent className="flex-1 space-y-4">
                {/* Price */}
                <div className="text-center">
                  {isLifetime ? (
                    <div>
                      {plan.originalLifetimePrice && (
                        <div className="text-lg text-muted-foreground line-through">
                          ${plan.originalLifetimePrice.toLocaleString()}
                        </div>
                      )}
                      <div className="text-4xl font-bold text-green-600">${plan.lifetimePrice?.toLocaleString()}</div>
                      <div className="text-muted-foreground text-sm mt-1">一次買斷</div>
                    </div>
                  ) : tier === 'free' ? (
                    <div>
                      <span className="text-4xl font-bold">$0</span>
                      <span className="text-muted-foreground ml-1">/月</span>
                    </div>
                  ) : (
                    <div>
                      {plan.originalPrice && (
                        <span className="text-lg text-muted-foreground line-through mr-2">
                          ${plan.originalPrice}
                        </span>
                      )}
                      <span className="text-4xl font-bold text-green-600">${plan.monthlyPrice}</span>
                      <span className="text-muted-foreground ml-1">/月</span>
                    </div>
                  )}
                </div>

                {/* Limits */}
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>腳本生成</span>
                    <span className="font-medium">
                      {plan.limits.script === -1 ? '無限' : `${plan.limits.script} 次/月`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>輪播貼文</span>
                    <span className="font-medium">
                      {plan.limits.carousel === -1 ? '無限' : `${plan.limits.carousel} 次/月`}
                    </span>
                  </div>
                </div>

                {/* Features */}
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className={cn(
                    "w-full",
                    isCurrentPlan && "bg-muted text-muted-foreground hover:bg-muted",
                    isPopular && !isCurrentPlan && "bg-purple-500 hover:bg-purple-600",
                    isLifetime && !isCurrentPlan && "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
                  )}
                  disabled={isCurrentPlan || tier === 'free'}
                  onClick={() => handleUpgrade(tier)}
                >
                  {isCurrentPlan
                    ? '目前方案'
                    : tier === 'free'
                      ? '免費使用'
                      : isLifetime
                        ? '立即購買'
                        : '升級方案'}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      {/* FAQ or additional info */}
      <div className="bg-muted/30 rounded-xl p-6 md:p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">有問題嗎？</h2>
        <p className="text-muted-foreground mb-4">
          如果你有任何問題，或需要客製化方案，歡迎聯繫我們
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="https://www.instagram.com/kanisleo328/"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              Instagram
            </Button>
          </a>
          <a
            href="https://reurl.cc/rKVpEx"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="w-full sm:w-auto gap-2">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.193 0-.378-.09-.503-.254l-1.544-2.028v1.655c0 .346-.279.63-.631.63-.346 0-.626-.284-.626-.63V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.504.254l1.533 2.015V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .346-.282.63-.63.63-.345 0-.627-.284-.627-.63V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.63H4.917c-.345 0-.63-.284-.63-.63V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314"/>
              </svg>
              LINE 客服
            </Button>
          </a>
        </div>
      </div>

      {/* Current usage */}
      {credits && (
        <Card className="bg-gradient-to-r from-primary/5 to-purple-500/5">
          <CardHeader>
            <CardTitle className="text-lg">本月使用狀況</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">腳本生成</p>
                <p className="text-2xl font-bold">
                  {credits.scriptLimit === -1
                    ? '無限'
                    : `${credits.scriptUsed} / ${credits.scriptLimit}`}
                </p>
                {credits.scriptLimit !== -1 && (
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${(credits.scriptUsed / credits.scriptLimit) * 100}%` }}
                    />
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">輪播貼文</p>
                <p className="text-2xl font-bold">
                  {credits.carouselLimit === -1
                    ? '無限'
                    : `${credits.carouselUsed} / ${credits.carouselLimit}`}
                </p>
                {credits.carouselLimit !== -1 && (
                  <div className="h-2 bg-muted rounded-full mt-2 overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full transition-all"
                      style={{ width: `${(credits.carouselUsed / credits.carouselLimit) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              額度將於每月 1 日重置
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
