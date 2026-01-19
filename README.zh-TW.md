[English](README.md) | [简体中文](README.zh-CN.md) | 繁體中文

# MCD-App 單體倉庫

一個多平台麥當勞 MCP（模型上下文協議）客戶端應用程式套件，透過 Swift Package Manager 共享 Swift 套件。

## 概述

此單體倉庫包含三個平台特定的應用程式，它們透過 Swift Package Manager (SPM) 套件共享核心業務邏輯和 UI 元件。

### 應用程式

- **[macOS 應用程式](apps/macos/README.md)** - 原生 macOS 應用程式
- **[iOS 應用程式](apps/ios/README.md)** - 原生 iOS 應用程式
- **[Web 應用程式](apps/web/README.md)** - Next.js Web 應用程式

### 共享套件

- **[MCDCore](packages/MCDCore/)** - 核心業務邏輯（模型、服務、視圖模型）
- **[MCDSharedUI](packages/MCDSharedUI/)** - 共享 SwiftUI 元件

## 快速開始

### 前置要求

- **Swift 應用程式:** Xcode 15+ 和 macOS 14+ 或 iOS 17+
- **Web 應用程式:** Node.js 20+ 和 npm

### 執行應用程式

**macOS:**
```bash
cd apps/macos/MCD-macOS
swift run
```

**iOS:**
```bash
open apps/ios/MCD-iOS/MCD-iOS.xcodeproj
# 在 Xcode 中建置並執行 (Cmd+R)
```

**Web:**
```bash
cd apps/web
npm install
npm run dev
```

## 設定

所有應用程式都需要 MCP 權杖。有關平台特定設定，請參閱各個應用程式的 README：

- [macOS 設定](apps/macos/README.md#configuration)
- [iOS 設定](apps/ios/README.md#configuration)
- [Web 設定](apps/web/README.md#configuration)

## 架構

有關系統設計，請參閱 [架構概述](docs/architecture/overview.md)，有關套件結構，請參閱 [SPM 工作空間指南](docs/architecture/spm-workspace.md)。

## 開發

有關開發指南和編碼標準，請參閱 [AGENTS.md](AGENTS.md)。

## 專案結構

```
mcd-app/
├── apps/                   # 平台特定應用程式
│   ├── ios/               # iOS 應用程式
│   ├── macos/             # macOS 應用程式
│   └── web/               # Next.js Web 應用程式
├── packages/              # 共享 Swift 套件
│   ├── MCDCore/          # 核心業務邏輯
│   └── MCDSharedUI/      # 共享 UI 元件
└── docs/                  # 文件
    ├── architecture/      # 架構文件
    ├── guides/           # 開發者指南
    └── plans/            # 設計文件
```

## 授權

私人專案 - 保留所有權利
