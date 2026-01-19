[English](README.md) | [简体中文](README.zh-CN.md) | 繁體中文

# MCD-iOS - 麥當勞 MCP iOS 應用程式

一個使用 MCP（模型上下文協議）伺服器管理麥當勞中國優惠券和行銷活動的原生 iOS 應用程式。

## 單體倉庫結構

此 iOS 應用程式是 mcd-app 單體倉庫的一部分，透過 Swift Package Manager 套件與 macOS 應用程式共享核心業務邏輯：

- **MCDCore** (`../../packages/MCDCore`) - 共享模型、服務和視圖模型
- **MCDSharedUI** (`../../packages/MCDSharedUI`) - 共享 SwiftUI 元件

這種架構實現了跨平台的程式碼重用，同時保持平台特定的 UI 實作。

## 功能特性

- **我的優惠券**: 查看您已領取的麥當勞優惠券並追蹤過期時間
- **行銷活動**: 瀏覽麥當勞行銷活動，支援日期選擇和篩選
- **可領優惠券**: 探索並領取新優惠券，支援一鍵「全部領取」功能

## 截圖

### 我的優惠券
- 查看所有已領取的優惠券
- 顏色編碼的過期警告（紅色：< 3 天，橙色：< 7 天）
- 顯示距離過期的剩餘天數
- 重新整理以更新優惠券列表

### 行銷活動
- 日期選擇器選擇活動日期
- 按狀態篩選：全部、進行中、已結束、即將開始
- 按標題或描述搜尋活動
- 查看活動詳情和訂閱狀態

### 可領優惠券
- 瀏覽所有可領取的優惠券
- 一次性領取所有優惠券
- 領取後自動重新整理

## 系統要求

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+
- 有效的麥當勞中國 MCP API 權杖

## 安裝

### 1. 複製倉庫

```bash
git clone <repository-url>
cd MCD-iOS
```

### 2. 設定 API 權杖

您需要一個有效的麥當勞中國 MCP API 權杖才能使用此應用程式。使用以下方法之一進行設定：

#### 選項 1：環境變數（推薦用於開發）

```bash
export MCD_MCP_TOKEN="your_token_here"
```

#### 選項 2：Config.plist 檔案

在 `MCD-iOS/` 目錄中建立 `Config.plist` 檔案：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>MCD_MCP_TOKEN</key>
    <string>your_token_here</string>
</dict>
</plist>
```

**注意**: `Config.plist` 檔案已在 `.gitignore` 中，不會提交到版本控制。

### 3. 開啟並建置

```bash
open MCD-iOS.xcodeproj
```

選擇您的目標裝置或模擬器，然後建置並執行（⌘R）。

## 架構

該應用程式遵循 **MVVM（Model-View-ViewModel）** 架構模式，具有清晰的關注點分離：

```
MCD-iOS/
├── MCSiOSApp.swift          # 應用程式進入點
├── Config.swift              # 設定管理
├── Models/                   # 資料模型
│   ├── Coupon.swift
│   ├── Campaign.swift
│   └── MCPResponse.swift
├── Services/                 # 網路層
│   ├── MCPClient.swift       # MCP API 客戶端
│   ├── MCPError.swift        # 錯誤處理
│   └── MarkdownParser.swift  # 回應解析
├── ViewModels/               # 業務邏輯
│   ├── CouponViewModel.swift
│   └── CampaignViewModel.swift
└── Views/                    # SwiftUI UI 元件
    ├── ContentView.swift
    ├── MyCouponsView.swift
    ├── CampaignsView.swift
    ├── AvailableCouponsView.swift
    ├── CouponCardView.swift
    └── CampaignCardView.swift
```

## 核心元件

### 模型層

- **Coupon**: 表示麥當勞優惠券，包含過期邏輯和警告級別
- **Campaign**: 表示行銷活動，包含狀態追蹤
- **MCPResponse**: API 回應的包裝類型

### 服務層

- **MCPClient**: 基於 Actor 的單例，用於執行緒安全的 MCP API 通訊
  - 5 分鐘回應快取
  - Bearer 權杖身分驗證
  - 處理網路、認證和速率限制錯誤
- **MarkdownParser**: 將 markdown 回應解析為結構化資料
- **MCPError**: 使用者友善的本地化錯誤類型

### 視圖模型層

- **CouponViewModel**: 管理優惠券狀態和操作
  - 取得我的優惠券
  - 取得可領優惠券
  - 自動領取所有優惠券
  - 快取重新整理
- **CampaignViewModel**: 管理活動狀態和篩選
  - 按日期取得活動
  - 按狀態篩選
  - 搜尋功能

### 視圖層

- **ContentView**: 基於標籤的導覽
- **MyCouponsView**: 使用者優惠券列表
- **CampaignsView**: 活動瀏覽器，帶日期選擇器和篩選器
- **AvailableCouponsView**: 可領取優惠券網格
- **CouponCardView**: 可重複使用的優惠券卡片元件
- **CampaignCardView**: 可重複使用的活動卡片元件

## API 整合

該應用程式與麥當勞中國 MCP 伺服器通訊，位址為：
```
https://mcp.mcd.cn/mcp-servers/mcd-mcp
```

### 可用的 MCP 工具

| 工具 | 用途 |
|------|---------|
| `my-coupons` | 取得使用者已領取的優惠券（分頁） |
| `available-coupons` | 取得可領取的優惠券 |
| `auto-bind-coupons` | 自動領取所有可用優惠券 |
| `campaign-calender` | 取得特定日期的活動 |
| `now-time-info` | 取得伺服器時間資訊 |

### 快取

`MCPClient` 為 API 回應實作了 5 分鐘快取，以便：
- 減少伺服器負載
- 提高應用程式回應速度
- 最小化網路使用

可以使用每個視圖中的重新整理按鈕手動清除快取。

## 功能詳解

### 過期警告系統

優惠券根據過期時間顯示顏色編碼的警告：

- **紅色**: 已過期或 < 3 天剩餘（嚴重）
- **橙色**: < 7 天剩餘（警告）
- **灰色**: 7+ 天剩餘（正常）

### 活動狀態追蹤

活動根據其日期範圍自動分類：

- **進行中**: 當前日期在開始和結束日期之間
- **即將開始**: 開始日期在未來
- **已結束**: 結束日期已過
- **未知**: 日期資訊不可用

### 錯誤處理

常見場景的使用者友善錯誤訊息：

- 網路連線問題
- 身分驗證失敗（無效權杖）
- 超過速率限制
- 伺服器錯誤
- 無效回應

## 開發

### 程式碼風格

- Swift 5.9+ 搭配現代並行（async/await）
- SwiftUI 用於宣告式 UI
- Actor 模式用於執行緒安全
- MVVM 架構模式
- 清晰的關注點分離

### 測試

該應用程式包含全面的測試覆蓋：
- 模型解碼和計算屬性
- 網路錯誤處理
- 回應解析
- 視圖模型狀態管理

執行測試：
```bash
xcodebuild test -scheme MCD-iOS -destination 'platform=iOS Simulator,name=iPhone 15'
```

## 疑難排解

### 應用程式啟動時當機

**原因**: 缺少或無效的 MCP 權杖

**解決方案**: 確保您已使用安裝部分中描述的方法之一設定了權杖。

### 網路錯誤

**原因**: 無效權杖或網路連線問題

**解決方案**:
1. 驗證您的權杖是否有效
2. 檢查您的網際網路連線
3. 嘗試重新整理視圖

### 優惠券/活動列表為空

**原因**: 所選日期/使用者沒有可用資料

**解決方案**: 這是正常的 - 嘗試不同的日期或領取一些優惠券！

## 貢獻

1. Fork 倉庫
2. 建立功能分支
3. 進行變更
4. 充分測試
5. 提交 pull request

## 授權

本專案僅用於教育和開發目的。使用麥當勞中國 MCP API 時，請尊重其服務條款。

## 致謝

- 使用 SwiftUI 和現代 Swift 並行建置
- 靈感來自 macOS 版本（mcd-app）
- 使用模型上下文協議（MCP）進行 API 通訊

## 相關專案

- **mcd-app**: 此應用程式的 macOS 版本
- **mcd-mcp**: 麥當勞中國 MCP 伺服器

## 支援

如有問題、疑問或貢獻，請在 GitHub 上開啟 issue。
