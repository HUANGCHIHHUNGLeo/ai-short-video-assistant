// 管理員後台頁面
'use client'

import { useEffect, useState } from 'react'
import { useUser } from '@/hooks/useUser'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Users,
  DollarSign,
  Cpu,
  TrendingUp,
  Search,
  RefreshCw,
  Shield,
  Banknote,
  PiggyBank,
} from 'lucide-react'

interface AdminStats {
  users: {
    total: number
    byTier: {
      free: number
      creator: number
      pro: number
      lifetime: number
    }
    newThisMonth: number
  }
  costs: {
    total: { usd: number; twd: number }
    thisMonth: { usd: number; twd: number }
    today: { usd: number; twd: number }
  }
  revenue: {
    total: number
    thisMonth: number
    today: number
    byTier: {
      creator: number
      pro: number
      lifetime: number
    }
    totalPayments: number
  }
  profit: {
    total: number
    thisMonth: number
    today: number
  }
  models: Array<{
    name: string
    calls: number
    costUsd: number
    costTwd: number
  }>
  generations: {
    thisMonth: number
  }
}

interface UserData {
  id: string
  email: string
  display_name: string | null
  subscription_tier: string
  subscription_status: string
  credits_script: number
  credits_carousel: number
  created_at: string
  totalCostUsd: number
  totalCostTwd: number
}

interface UsersResponse {
  users: UserData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export default function AdminPage() {
  const { profile, isLoading: isUserLoading, isAuthenticated } = useUser()
  const router = useRouter()

  const [stats, setStats] = useState<AdminStats | null>(null)
  const [users, setUsers] = useState<UsersResponse | null>(null)
  const [isLoadingStats, setIsLoadingStats] = useState(true)
  const [isLoadingUsers, setIsLoadingUsers] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [tierFilter, setTierFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)

  // 檢查管理員權限
  useEffect(() => {
    if (!isUserLoading && !isAuthenticated) {
      router.push('/')
    }
  }, [isUserLoading, isAuthenticated, router])

  // 載入統計資料
  const fetchStats = async () => {
    setIsLoadingStats(true)
    try {
      const res = await fetch('/api/admin/stats')
      if (res.ok) {
        const data = await res.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    }
    setIsLoadingStats(false)
  }

  // 載入用戶列表
  const fetchUsers = async () => {
    setIsLoadingUsers(true)
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        ...(tierFilter !== 'all' && { tier: tierFilter }),
        ...(searchTerm && { search: searchTerm }),
      })
      const res = await fetch(`/api/admin/users?${params}`)
      if (res.ok) {
        const data = await res.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Failed to fetch users:', error)
    }
    setIsLoadingUsers(false)
  }

  useEffect(() => {
    if (isAuthenticated && profile) {
      fetchStats()
    }
  }, [isAuthenticated, profile])

  useEffect(() => {
    if (isAuthenticated && profile) {
      fetchUsers()
    }
  }, [isAuthenticated, profile, currentPage, tierFilter])

  const handleSearch = () => {
    setCurrentPage(1)
    fetchUsers()
  }

  const tierColors: Record<string, string> = {
    free: 'bg-gray-500/20 text-gray-600',
    creator: 'bg-blue-500/20 text-blue-600',
    pro: 'bg-purple-500/20 text-purple-600',
    lifetime: 'bg-amber-500/20 text-amber-600',
  }

  const tierNames: Record<string, string> = {
    free: '免費版',
    creator: '創作者版',
    pro: '專業版',
    lifetime: '終身版',
  }

  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  if (!profile?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Shield className="h-16 w-16 text-muted-foreground" />
        <h1 className="text-2xl font-bold">無權限存取</h1>
        <p className="text-muted-foreground">此頁面僅限管理員存取</p>
        <Button onClick={() => router.push('/')}>返回首頁</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">管理員後台</h1>
          <p className="text-muted-foreground mt-1">查看訂閱狀態和 API 成本統計</p>
        </div>
        <Button onClick={() => { fetchStats(); fetchUsers() }} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          重新整理
        </Button>
      </div>

      {/* 收入與利潤卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Card className="border-green-500/30 bg-green-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-green-600">本月收入</CardTitle>
            <Banknote className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              NT${stats?.revenue?.thisMonth?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              總收入 NT${stats?.revenue?.total?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-600">本月成本</CardTitle>
            <DollarSign className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              NT${stats?.costs.thisMonth.twd || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              總成本 NT${stats?.costs.total.twd || 0}
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-500/30 bg-blue-500/5">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-blue-600">本月利潤</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.profit?.thisMonth || 0) >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              NT${stats?.profit?.thisMonth?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              總利潤 NT${stats?.profit?.total?.toLocaleString() || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">總用戶數</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.users.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              本月新增 {stats?.users.newThisMonth || 0} 人
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 今日統計卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">今日收入</CardTitle>
            <Banknote className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              NT${stats?.revenue?.today?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              共 {stats?.revenue?.totalPayments || 0} 筆付款
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">今日成本</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              NT${stats?.costs.today.twd || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              ${stats?.costs.today.usd || 0} USD
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">今日利潤</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats?.profit?.today || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              NT${stats?.profit?.today?.toLocaleString() || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">本月生成數</CardTitle>
            <Cpu className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.generations?.thisMonth || 0}</div>
            <p className="text-xs text-muted-foreground">
              次 API 呼叫
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 訂閱分布 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>訂閱分布</CardTitle>
            <CardDescription>各方案用戶數量</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(stats?.users.byTier || {}).map(([tier, count]) => (
                <div key={tier} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className={tierColors[tier]}>
                      {tierNames[tier] || tier}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-bold">{count}</span>
                    <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{
                          width: `${(count / (stats?.users.total || 1)) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>模型使用統計</CardTitle>
            <CardDescription>各模型 API 呼叫次數與成本</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.models.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">尚無使用記錄</p>
              ) : (
                stats?.models.map((model) => (
                  <div key={model.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{model.name}</p>
                      <p className="text-xs text-muted-foreground">{model.calls} 次呼叫</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">NT${model.costTwd}</p>
                      <p className="text-xs text-muted-foreground">${model.costUsd} USD</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 用戶列表 */}
      <Card>
        <CardHeader>
          <CardTitle>用戶管理</CardTitle>
          <CardDescription>查看和管理所有用戶</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜尋和篩選 */}
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="搜尋 Email 或名稱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button onClick={handleSearch} variant="secondary">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            <Select value={tierFilter} onValueChange={(v) => { setTierFilter(v); setCurrentPage(1) }}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="篩選方案" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部方案</SelectItem>
                <SelectItem value="free">免費版</SelectItem>
                <SelectItem value="creator">創作者版</SelectItem>
                <SelectItem value="pro">專業版</SelectItem>
                <SelectItem value="lifetime">終身版</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 用戶表格 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>用戶</TableHead>
                  <TableHead>方案</TableHead>
                  <TableHead>額度</TableHead>
                  <TableHead>總花費</TableHead>
                  <TableHead>註冊時間</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoadingUsers ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <RefreshCw className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : users?.users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      無符合條件的用戶
                    </TableCell>
                  </TableRow>
                ) : (
                  users?.users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{user.display_name || '未設定'}</p>
                          <p className="text-sm text-muted-foreground">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={tierColors[user.subscription_tier]}>
                          {tierNames[user.subscription_tier] || user.subscription_tier}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>腳本: {user.credits_script}</p>
                          <p>輪播: {user.credits_carousel}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">NT${user.totalCostTwd}</p>
                          <p className="text-muted-foreground">${user.totalCostUsd} USD</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.created_at).toLocaleDateString('zh-TW')}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分頁 */}
          {users && users.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                共 {users.pagination.total} 位用戶
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  上一頁
                </Button>
                <span className="flex items-center px-2 text-sm">
                  {currentPage} / {users.pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(users.pagination.totalPages, p + 1))}
                  disabled={currentPage === users.pagination.totalPages}
                >
                  下一頁
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
