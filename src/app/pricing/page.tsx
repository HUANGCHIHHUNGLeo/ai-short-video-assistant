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

  const handleUpgrade = (tier: SubscriptionTier) => {
    // 暫時直接升級（未來接 Stripe）
    if (tier === 'free') return

    // 模擬付款成功
    const confirmed = window.confirm(
      tier === 'lifetime'
        ? `確定要購買買斷版（NT$19,800）嗎？\n\n（目前為測試模式，點擊確定將直接升級）`
        : `確定要升級到${PLANS[tier].name}（NT$${PLANS[tier].monthlyPrice}/月）嗎？\n\n（目前為測試模式，點擊確定將直接升級）`
    )

    if (confirmed) {
      upgrade(tier)
      alert(`已升級到 ${PLANS[tier].name}！`)
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
                      <span className="text-4xl font-bold">NT${plan.lifetimePrice?.toLocaleString()}</span>
                      <span className="text-muted-foreground ml-1">一次買斷</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-bold">NT${plan.monthlyPrice}</span>
                      <span className="text-muted-foreground ml-1">/月</span>
                    </div>
                  )}
                  {plan.yearlyPrice && (
                    <p className="text-sm text-muted-foreground mt-1">
                      年繳 NT${plan.yearlyPrice.toLocaleString()}（省 {Math.round((1 - plan.yearlyPrice / (plan.monthlyPrice * 12)) * 100)}%）
                    </p>
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
        <Button variant="outline">
          聯繫客服
        </Button>
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
