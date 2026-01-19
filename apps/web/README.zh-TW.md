[English](README.md) | [简体中文](README.zh-CN.md) | 繁體中文

# MCD-Web - 麥當勞 MCP Web 應用程式

一個使用 MCP（模型上下文協議）API 管理麥當勞中國優惠券和行銷活動的 Next.js Web 應用程式。

## 功能特性

- **我的優惠券**: 查看和管理您已領取的麥當勞優惠券並追蹤過期時間
- **可領優惠券**: 探索並領取麥當勞促銷活動的新優惠券
- **行銷活動**: 瀏覽麥當勞行銷活動，支援日期選擇和篩選

## 技術堆疊

- **框架**: Next.js 16.1.3 with App Router
- **UI 函式庫**: React 19.2.3
- **樣式**: Tailwind CSS 4
- **狀態管理**:
  - TanStack Query v5（伺服器狀態）
  - Zustand 5.0（客戶端狀態）
- **語言**: TypeScript 5
- **測試**: Vitest（單元測試）+ Playwright（E2E）

## 系統要求

- Node.js 20.11.1（在 `.nvmrc` 中指定）
- npm

## 設定

```bash
cd apps/web
nvm use   # 從 .nvmrc 使用 Node 20.11.1
npm install
```

### 環境變數

複製 `.env.example` 到 `.env.local` 並設定：

```bash
cp .env.example .env.local
```

必需的環境變數：
- `MCD_MCP_TOKEN` - 您的麥當勞中國 MCP API 權杖

**安全提示**: MCP API 權杖僅保存在伺服器端。切勿將 `MCD_MCP_TOKEN` 暴露給客戶端套件。

## 開發

啟動開發伺服器：

```bash
npm run dev
```

其他有用的指令：

- `npm run build` - 生產建置
- `npm run start` - 啟動生產伺服器
- `npm run lint` - 執行 ESLint（零警告政策）
- `npm test` - 執行 Vitest 單元測試
- `npm run test:watch` - 監視模式執行測試
- `npm run test:e2e` - 執行 Playwright E2E 測試

## 專案結構

```
web/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由（伺服器端 MCP 呼叫）
│   │   │   ├── available-coupons/
│   │   │   ├── auto-claim/
│   │   │   ├── campaigns/
│   │   │   └── coupons/
│   │   ├── available/        # 可領優惠券頁面
│   │   ├── campaigns/        # 行銷活動頁面
│   │   ├── coupons/          # 我的優惠券頁面
│   │   ├── globals.css       # Tailwind CSS 設定
│   │   ├── layout.tsx        # 根佈局
│   │   └── page.tsx          # 首頁
│   ├── components/           # 可重用 React 元件
│   ├── hooks/                # 自訂 React Hooks（useCoupons 等）
│   └── lib/                  # 實用工具和設定
└── tests/                    # 測試檔案
    ├── api/                  # API 路由測試
    ├── components/           # 元件測試
    ├── hooks/                # Hook 測試
    └── lib/                  # 實用工具測試
```

## API 整合

此應用程式透過伺服器端 API 路由與麥當勞中國 MCP 伺服器通訊：

```
https://mcp.mcd.cn/mcp-servers/mcd-mcp
```

### API 路由

| 路由 | MCP 工具 | 用途 |
|-------|----------|---------|
| `/api/coupons` | `my-coupons` | 取得使用者已領取的優惠券 |
| `/api/available-coupons` | `available-coupons` | 取得可領取的優惠券 |
| `/api/auto-claim` | `auto-bind-coupons` | 自動領取所有優惠券 |
| `/api/campaigns` | `campaign-calender` | 按日期取得行銷活動 |

所有 API 呼叫包含 Bearer 權杖驗證並適當快取。

## 測試

### 單元測試（Vitest）

目前有 **72 個通過的測試**，涵蓋：
- API 路由處理程式
- MCP 客戶端功能
- React Hooks
- UI 元件

執行測試：
```bash
npm test
```

### E2E 測試（Playwright）

端對端測試覆蓋關鍵使用者流程：
- 查看和領取優惠券
- 瀏覽行銷活動
- 導覽和路由

執行 E2E 測試：
```bash
npm run test:e2e
```

## 架構說明

- **App Router**: 使用 Next.js 14+ App Router 與 React Server Components
- **伺服器端 MCP 呼叫**: 所有 MCP API 請求都在 API 路由中進行（永不在客戶端）
- **TanStack Query**: 管理伺服器狀態、快取和自動重新取得
- **Tailwind CSS**: 實用優先的樣式與全域設定
- **類型安全**: 完整的 TypeScript 覆蓋，啟用嚴格模式

## 相關應用程式

- **iOS 應用程式** (`apps/ios/`) - 原生 iOS 版本
- **macOS 應用程式** (`apps/macos/`) - 原生 macOS 版本

兩個原生應用程式透過 Swift 套件（MCDCore、MCDSharedUI）共享業務邏輯。

## 授權

私人專案 - 保留所有權利
