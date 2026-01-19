[English](README.md) | 简体中文 | [繁體中文](README.zh-TW.md)

# 麦当劳 MCP macOS 应用

一个通过 MCP（模型上下文协议）API 管理麦当劳优惠券和营销活动的原生 macOS 应用程序。

## 功能特性

- **我的优惠券**: 查看和管理您可用的麦当劳优惠券
- **营销活动**: 浏览当前的麦当劳营销活动和日历
- **可领优惠券**: 发现并领取麦当劳促销活动中的新优惠券

## 系统要求

- macOS 14.0 或更高版本
- Swift 5.9 或更高版本
- Xcode 15.0 或更高版本（用于开发）

## 构建

构建应用程序：

```bash
swift build
```

构建优化的发布版本：

```bash
swift build -c release
```

## 运行

运行应用程序：

```bash
swift run
```

应用将启动并连接到您的 `~/.mcp.json` 文件中配置的麦当劳 MCP API 端点。

## 架构

此应用程序遵循 **MVVM（Model-View-ViewModel）** 架构模式：

- **Models**: 优惠券、活动和 API 响应的数据结构
- **Views**: 用户界面的 SwiftUI 视图（CouponListView、CampaignCalendarView、AvailableCouponsView）
- **ViewModels**: 业务逻辑层（CouponViewModel、CampaignViewModel）
- **Services**: 使用 URLSession 进行网络通信的 API 客户端（MCPClient）

### 技术栈

- **SwiftUI**: 现代声明式 UI 框架
- **Swift Concurrency**: async/await 用于异步操作
- **URLSession**: 原生网络层
- **MCP API**: 麦当劳模型上下文协议集成

## 项目结构

```
MCDApp/
├── Package.swift           # Swift 包清单
├── README.md              # 本文件
├── MCDApp/                # 主应用程序代码
│   ├── MCDApp.swift       # 应用入口点
│   ├── Models/            # 数据模型
│   │   ├── Coupon.swift
│   │   ├── Campaign.swift
│   │   └── TimeInfo.swift
│   ├── Services/          # API 客户端
│   │   └── MCPClient.swift
│   ├── ViewModels/        # 业务逻辑
│   │   ├── CouponViewModel.swift
│   │   └── CampaignViewModel.swift
│   └── Views/             # SwiftUI 视图
│       ├── ContentView.swift
│       ├── CouponListView.swift
│       ├── CampaignCalendarView.swift
│       └── AvailableCouponsView.swift
└── MCDAppTests/           # 测试套件
    ├── ModelTests.swift
    ├── MCPClientTests.swift
    ├── ViewModelTests.swift
    └── IntegrationTests.swift
```

## 配置

### API 令牌设置

您需要一个麦当劳中国 MCP API 令牌。使用以下方法之一进行配置：

**选项 A：环境变量（推荐）**
```bash
export MCD_MCP_TOKEN=your_token_here
swift run
```

**选项 B：配置文件**
```bash
# 复制模板
cp MCDApp/Config.plist.example MCDApp/Config.plist

# 编辑 Config.plist 并将 YOUR_TOKEN_HERE 替换为您的实际令牌
```

**选项 C：用于 Claude Code MCP 集成**
```bash
# 复制模板（在项目根目录）
cp ../.mcp.json.example ../.mcp.json

# 编辑 .mcp.json 并将 YOUR_TOKEN_HERE 替换为您的实际令牌
```

> ⚠️ **安全提示**: 切勿将 `Config.plist` 或 `.mcp.json` 提交到 git。这些文件已在 `.gitignore` 中。

## 测试

运行测试套件：

```bash
swift test
```

测试套件包括：
- 模型解码测试
- 视图模型状态测试
- MCPClient 错误处理测试
- 集成测试（默认跳过）

## 许可证

专有 - 麦当劳 MCP 集成
