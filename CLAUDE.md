# AI 短影音助理 - 專案規範

## 專案概述

這是一個基於 Next.js 的 AI 短影音助理 SaaS 平台，幫助創作者進行定位分析、腳本生成、輪播貼文製作等內容創作任務。

## 技術棧

- **前端框架**: Next.js 14+ (App Router)
- **UI 組件**: shadcn/ui (Radix UI)
- **樣式**: Tailwind CSS 4
- **數據庫**: Supabase (PostgreSQL)
- **認證**: Supabase Auth + Google OAuth
- **AI**: OpenAI GPT-4o
- **支付**: Stripe
- **語言**: TypeScript 5.6+

## 程式碼規範

### 一致性原則

整個專案的程式碼風格必須保持一致：

1. **命名規範**
   - 組件檔案：PascalCase (例如 `PositioningSelector.tsx`)
   - 工具函數：camelCase (例如 `formatDate`)
   - API 路由：kebab-case 資料夾 (例如 `/api/generate-script`)
   - 常量：UPPER_SNAKE_CASE (例如 `TIER_SCRIPT_LIMITS`)

2. **檔案結構**
   ```
   src/
   ├── app/                    # Next.js App Router 頁面
   │   ├── api/               # API 路由
   │   └── [feature]/         # 功能頁面
   ├── components/            # 可重用組件
   │   ├── ui/               # shadcn/ui 基礎組件
   │   ├── auth/             # 認證相關組件
   │   ├── billing/          # 計費相關組件
   │   ├── layout/           # 佈局組件
   │   └── positioning/      # 定位功能組件
   ├── hooks/                 # 自定義 React Hooks
   ├── lib/                   # 工具函數和配置
   │   ├── auth/             # 認證工具
   │   ├── supabase/         # Supabase 客戶端
   │   └── credits/          # 額度管理
   └── types/                 # TypeScript 類型定義
   ```

3. **組件規範**
   - 使用 `"use client"` 標記客戶端組件
   - 優先使用 shadcn/ui 組件
   - 保持組件單一職責
   - 使用 `cn()` 函數合併 className

4. **API 規範**
   - 所有 API 必須進行認證檢查 (`checkApiAuth`)
   - 成功操作後記錄使用量 (`recordUsage`)
   - 保存生成記錄到 `generations` 表 (`saveGeneration`)
   - 追蹤 API 成本 (`trackApiCost`)

5. **錯誤處理**
   - API 返回統一的錯誤格式 `{ error: string, statusCode?: number }`
   - 前端使用 try-catch 處理錯誤
   - 顯示友善的中文錯誤訊息

### TypeScript 規範

- 避免使用 `any`，必要時使用 `unknown` 並進行類型斷言
- 為所有函數參數和返回值定義類型
- 使用 interface 定義物件類型
- 使用 type 定義聯合類型或映射類型

### CSS 規範

- 優先使用 Tailwind CSS 類名
- 使用 CSS 變數定義主題色 (透過 shadcn/ui)
- 響應式設計使用 `sm:` `md:` `lg:` 前綴
- 暗色模式使用 `dark:` 前綴

## 功能模組

### 1. AI 定位分析 (`/positioning`)
- 10 步驟問卷收集用戶資訊
- 生成專業定位報告
- 保存記錄供其他功能使用

### 2. 腳本生成器 (`/script-generator`)
- 支援選擇過去的定位記錄
- 生成多版本腳本
- 支援多種拍攝類型

### 3. 輪播貼文 (`/carousel-post`)
- 生成社群媒體輪播圖文案
- 支援複製和下載

### 4. 選題推薦 (`/topic-ideas`)
- 基於定位推薦選題
- 支援熱門話題搜尋

### 5. 文案優化 (`/copy-optimizer`)
- 優化現有文案
- 提供多種風格選擇

## 數據庫結構

### 主要表

- `profiles`: 用戶資料和訂閱資訊
- `generations`: 生成記錄 (定位、腳本、輪播等)
- `usage_logs`: 使用量日誌
- `api_cost_logs`: API 成本追蹤

### 額度管理

- `credits_script`: 腳本類額度 (定位、腳本、選題、文案優化)
- `credits_carousel`: 輪播類額度

## 開發指南

### 新增功能

1. 在 `src/app/` 下創建功能目錄
2. 創建 `page.tsx` 作為主頁面
3. 創建 `/api/[feature]/route.ts` 作為 API
4. 在 API 中使用 `checkApiAuth`, `recordUsage`, `saveGeneration`
5. 更新導航菜單 (在 `DashboardLayout`)

### 新增組件

1. 在 `src/components/[category]/` 下創建組件檔案
2. 創建 `index.ts` 導出組件
3. 使用 shadcn/ui 基礎組件
4. 撰寫 TypeScript 類型定義

### API 開發模板

```typescript
import { NextRequest, NextResponse } from "next/server"
import { checkApiAuth, recordUsage, authError, saveGeneration } from "@/lib/auth/api-guard"
import { trackApiCost } from "@/lib/cost-tracking"

export async function POST(request: NextRequest) {
  try {
    // 1. 認證檢查
    const authResult = await checkApiAuth(request, 'feature_type')
    if (!authResult.allowed) {
      return authError(authResult)
    }

    // 2. 處理請求
    const body = await request.json()
    // ... 業務邏輯

    // 3. 記錄使用量
    await recordUsage(request, authResult.userId, 'feature_type')

    // 4. 保存生成記錄
    await saveGeneration({
      userId: authResult.userId,
      featureType: 'feature_type',
      title: '標題',
      inputData: body,
      outputData: result
    })

    // 5. 追蹤成本
    await trackApiCost({ ... })

    return NextResponse.json({ ... })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "錯誤訊息" }, { status: 500 })
  }
}
```

## 環境變數

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=

# Stripe
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=

# App
NEXT_PUBLIC_SITE_URL=
```

## 注意事項

1. 不要在客戶端暴露敏感 API 金鑰
2. 所有 API 都要進行額度檢查
3. 保持 UI 的響應式設計
4. 使用中文作為用戶介面語言
5. 錯誤訊息要友善且有幫助
