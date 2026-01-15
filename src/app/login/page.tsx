// 登入頁面
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, LogIn, UserPlus, Video, ArrowLeft } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

export default function LoginPage() {
  const router = useRouter()
  const { user, isLoading: userLoading, signInWithPassword, signUp } = useUser()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  // 如果已登入，跳轉到首頁
  useEffect(() => {
    if (!userLoading && user) {
      router.push('/')
    }
  }, [user, userLoading, router])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signInWithPassword(email, password)

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? '帳號或密碼錯誤'
        : error.message)
      setIsLoading(false)
    } else {
      // 登入成功，useEffect 會處理跳轉
      router.push('/')
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('密碼不一致')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('密碼至少需要 6 個字元')
      setIsLoading(false)
      return
    }

    const { error } = await signUp(email, password, displayName)

    if (error) {
      if (error.message.includes('already registered')) {
        setError('此 Email 已被註冊')
      } else {
        setError(error.message)
      }
      setIsLoading(false)
    } else {
      setSuccess('註冊成功！請登入您的帳號')
      setActiveTab('login')
      setPassword('')
      setConfirmPassword('')
      setIsLoading(false)
    }
  }

  // Loading 狀態
  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // 已登入
  if (user) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="p-4">
        <Link href="/">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回首頁
          </Button>
        </Link>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <Video className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">AI 短影音助理</h1>
            <p className="text-muted-foreground mt-2">登入後即可使用所有功能</p>
          </div>

          {/* Login Card */}
          <Card>
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl text-center">
                {activeTab === 'login' ? '歡迎回來' : '建立帳號'}
              </CardTitle>
              <CardDescription className="text-center">
                {activeTab === 'login'
                  ? '輸入您的帳號密碼登入'
                  : '註冊新帳號開始使用'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={(v) => {
                setActiveTab(v as 'login' | 'register')
                setError(null)
                setSuccess(null)
              }}>
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login">登入</TabsTrigger>
                  <TabsTrigger value="register">註冊</TabsTrigger>
                </TabsList>

                {/* 登入表單 */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password">密碼</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="輸入密碼"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="current-password"
                      />
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    {success && (
                      <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                        <p className="text-sm text-green-600">{success}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading || !email || !password}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <LogIn className="mr-2 h-4 w-4" />
                      )}
                      登入
                    </Button>
                  </form>
                </TabsContent>

                {/* 註冊表單 */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">顯示名稱 <span className="text-muted-foreground">(選填)</span></Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="你的名稱"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        disabled={isLoading}
                        autoComplete="name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="email"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-password">密碼</Label>
                      <Input
                        id="register-password"
                        type="password"
                        placeholder="至少 6 個字元"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="register-confirm">確認密碼</Label>
                      <Input
                        id="register-confirm"
                        type="password"
                        placeholder="再次輸入密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        disabled={isLoading}
                        autoComplete="new-password"
                      />
                    </div>

                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <p className="text-sm text-destructive">{error}</p>
                      </div>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={isLoading || !email || !password || !confirmPassword}
                    >
                      {isLoading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      建立帳號
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer */}
          <p className="text-center text-sm text-muted-foreground mt-6">
            登入即表示您同意我們的服務條款與隱私政策
          </p>
        </div>
      </main>
    </div>
  )
}
