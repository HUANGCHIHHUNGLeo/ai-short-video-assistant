// 登入彈窗元件 - 帳號密碼登入
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, LogIn, UserPlus } from 'lucide-react'
import { useUser } from '@/hooks/useUser'

interface AuthModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AuthModal({ open, onOpenChange }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login')

  const { signInWithPassword, signUp } = useUser()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const { error } = await signInWithPassword(email, password)

    if (error) {
      setError(error.message === 'Invalid login credentials'
        ? '帳號或密碼錯誤'
        : error.message)
    } else {
      handleClose(false)
    }

    setIsLoading(false)
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

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
    } else {
      handleClose(false)
    }

    setIsLoading(false)
  }

  const handleClose = (open: boolean) => {
    if (!open) {
      // 重置狀態
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setDisplayName('')
      setError(null)
      setActiveTab('login')
    }
    onOpenChange(open)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="text-xl">歡迎使用 AI 短影音助理</DialogTitle>
          <DialogDescription>
            登入後即可使用所有功能並儲存歷史記錄
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">登入</TabsTrigger>
            <TabsTrigger value="register">註冊</TabsTrigger>
          </TabsList>

          {/* 登入 */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4 pt-4">
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
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
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

          {/* 註冊 */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="register-name">顯示名稱</Label>
                <Input
                  id="register-name"
                  type="text"
                  placeholder="你的名稱"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
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
                />
              </div>

              {error && (
                <p className="text-sm text-destructive">{error}</p>
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
      </DialogContent>
    </Dialog>
  )
}
