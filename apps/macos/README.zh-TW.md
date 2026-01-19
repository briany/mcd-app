[English](README.md) | [简体中文](README.zh-CN.md) | 繁體中文

# 麥當勞 MCP macOS 應用程式

一個透過 MCP（模型上下文協議）API 管理麥當勞優惠券和行銷活動的原生 macOS 應用程式。

## 功能特性

- **我的優惠券**: 查看和管理您可用的麥當勞優惠券
- **行銷活動**: 瀏覽當前的麥當勞行銷活動和日曆
- **可領優惠券**: 探索並領取麥當勞促銷活動中的新優惠券

## 系統要求

- macOS 14.0 或更高版本
- Swift 5.9 或更高版本
- Xcode 15.0 或更高版本（用於開發）

## 建置

建置應用程式：

```bash
swift build
```

建置最佳化的發佈版本：

```bash
swift build -c release
```

## 執行

執行應用程式：

```bash
swift run
```

應用程式將啟動並連線到您的 `~/.mcp.json` 檔案中設定的麥當勞 MCP API 端點。

## 架構

此應用程式遵循 **MVVM（Model-View-ViewModel）** 架構模式：

- **Models**: 優惠券、活動和 API 回應的資料結構
- **Views**: 使用者介面的 SwiftUI 視圖（CouponListView、CampaignCalendarView、AvailableCouponsView）
- **ViewModels**: 業務邏輯層（CouponViewModel、CampaignViewModel）
- **Services**: 使用 URLSession 進行網路通訊的 API 客戶端（MCPClient）

### 技術堆疊

- **SwiftUI**: 現代宣告式 UI 框架
- **Swift Concurrency**: async/await 用於非同步操作
- **URLSession**: 原生網路層
- **MCP API**: 麥當勞模型上下文協議整合

## 專案結構

```
MCDApp/
├── Package.swift           # Swift 套件清單
├── README.md              # 本檔案
├── MCDApp/                # 主應用程式程式碼
│   ├── MCDApp.swift       # 應用程式進入點
│   ├── Models/            # 資料模型
│   │   ├── Coupon.swift
│   │   ├── Campaign.swift
│   │   └── TimeInfo.swift
│   ├── Services/          # API 客戶端
│   │   └── MCPClient.swift
│   ├── ViewModels/        # 業務邏輯
│   │   ├── CouponViewModel.swift
│   │   └── CampaignViewModel.swift
│   └── Views/             # SwiftUI 視圖
│       ├── ContentView.swift
│       ├── CouponListView.swift
│       ├── CampaignCalendarView.swift
│       └── AvailableCouponsView.swift
└── MCDAppTests/           # 測試套件
    ├── ModelTests.swift
    ├── MCPClientTests.swift
    ├── ViewModelTests.swift
    └── IntegrationTests.swift
```

## 設定

### API 權杖設定

您需要一個麥當勞中國 MCP API 權杖。使用以下方法之一進行設定：

**選項 A：環境變數（推薦）**
```bash
export MCD_MCP_TOKEN=your_token_here
swift run
```

**選項 B：設定檔案**
```bash
# 複製範本
cp MCDApp/Config.plist.example MCDApp/Config.plist

# 編輯 Config.plist 並將 YOUR_TOKEN_HERE 替換為您的實際權杖
```

**選項 C：用於 Claude Code MCP 整合**
```bash
# 複製範本（在專案根目錄）
cp ../.mcp.json.example ../.mcp.json

# 編輯 .mcp.json 並將 YOUR_TOKEN_HERE 替換為您的實際權杖
```

> ⚠️ **安全提示**: 切勿將 `Config.plist` 或 `.mcp.json` 提交到 git。這些檔案已在 `.gitignore` 中。

## 測試

執行測試套件：

```bash
swift test
```

測試套件包括：
- 模型解碼測試
- 視圖模型狀態測試
- MCPClient 錯誤處理測試
- 整合測試（預設跳過）

## 授權

專有 - 麥當勞 MCP 整合
