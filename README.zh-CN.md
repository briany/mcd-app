[English](README.md) | 简体中文 | [繁體中文](README.zh-TW.md)

# MCD-App 单体仓库

一个多平台麦当劳 MCP（模型上下文协议）客户端应用程序套件，通过 Swift Package Manager 共享 Swift 包。

## 概述

此单体仓库包含三个平台特定的应用程序，它们通过 Swift Package Manager (SPM) 包共享核心业务逻辑和 UI 组件。

### 应用程序

- **[macOS 应用](apps/macos/README.md)** - 原生 macOS 应用程序
- **[iOS 应用](apps/ios/README.md)** - 原生 iOS 应用程序
- **[Web 应用](apps/web/README.md)** - Next.js Web 应用程序

### 共享包

- **[MCDCore](packages/MCDCore/)** - 核心业务逻辑（模型、服务、视图模型）
- **[MCDSharedUI](packages/MCDSharedUI/)** - 共享 SwiftUI 组件

## 快速开始

### 前置要求

- **Swift 应用:** Xcode 15+ 和 macOS 14+ 或 iOS 17+
- **Web 应用:** Node.js 20+ 和 npm

### 运行应用程序

**macOS:**
```bash
cd apps/macos/MCD-macOS
swift run
```

**iOS:**
```bash
open apps/ios/MCD-iOS/MCD-iOS.xcodeproj
# 在 Xcode 中构建并运行 (Cmd+R)
```

**Web:**
```bash
cd apps/web
npm install
npm run dev
```

## 配置

所有应用程序都需要 MCP 令牌。有关平台特定配置，请参阅各个应用的 README：

- [macOS 配置](apps/macos/README.md#configuration)
- [iOS 配置](apps/ios/README.md#configuration)
- [Web 配置](apps/web/README.md#configuration)

## 架构

有关系统设计，请参阅 [架构概述](docs/architecture/overview.md)，有关包结构，请参阅 [SPM 工作空间指南](docs/architecture/spm-workspace.md)。

## 开发

有关开发指南和编码标准，请参阅 [AGENTS.md](AGENTS.md)。

## 项目结构

```
mcd-app/
├── apps/                   # 平台特定应用程序
│   ├── ios/               # iOS 应用
│   ├── macos/             # macOS 应用
│   └── web/               # Next.js Web 应用
├── packages/              # 共享 Swift 包
│   ├── MCDCore/          # 核心业务逻辑
│   └── MCDSharedUI/      # 共享 UI 组件
└── docs/                  # 文档
    ├── architecture/      # 架构文档
    ├── guides/           # 开发者指南
    └── plans/            # 设计文档
```

## 许可证

私有项目 - 保留所有权利
