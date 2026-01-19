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

## 测试与 CI

项目包含跨所有平台的全面测试覆盖：

### Swift 包
- **MCDCore**: 模型、服务、视图模型和 Markdown 解析的单元测试
- **MCDSharedUI**: SwiftUI 视图的组件测试

```bash
# 测试 MCDCore
swift test --package-path packages/MCDCore

# 测试 MCDSharedUI
swift test --package-path packages/MCDSharedUI
```

### Web 应用
- **72 个通过的单元测试**，使用 Vitest
- **E2E 测试**，使用 Playwright
- **组件测试**，使用 Testing Library

```bash
cd apps/web
npm test              # 单元测试
npm run test:e2e      # E2E 测试
```

### 持续集成

GitHub Actions 工作流在每次推送时运行：
- 测试所有 Swift 包（MCDCore、MCDSharedUI）
- 构建 iOS 应用（iPhone 17 Pro 模拟器）
- 构建 macOS 应用
- 测试和构建 Web 应用（lint、单元测试、E2E、生产构建）

所有平台必须通过 CI 检查才能合并。

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
