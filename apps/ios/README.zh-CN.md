[English](README.md) | 简体中文 | [繁體中文](README.zh-TW.md)

# MCS-iOS - 麦当劳 MCP iOS 应用

一个使用 MCP（模型上下文协议）服务器管理麦当劳中国优惠券和营销活动的原生 iOS 应用程序。

## 功能特性

- **我的优惠券**: 查看您已领取的麦当劳优惠券并跟踪过期时间
- **营销活动**: 浏览麦当劳营销活动，支持日期选择和筛选
- **可领优惠券**: 发现并领取新优惠券，支持一键"全部领取"功能

## 截图

### 我的优惠券
- 查看所有已领取的优惠券
- 颜色编码的过期警告（红色：< 3 天，橙色：< 7 天）
- 显示距离过期的剩余天数
- 刷新以更新优惠券列表

### 营销活动
- 日期选择器选择活动日期
- 按状态筛选：全部、进行中、已结束、即将开始
- 按标题或描述搜索活动
- 查看活动详情和订阅状态

### 可领优惠券
- 浏览所有可领取的优惠券
- 一次性领取所有优惠券
- 领取后自动刷新

## 系统要求

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+
- 有效的麦当劳中国 MCP API 令牌

## 安装

### 1. 克隆仓库

```bash
git clone <repository-url>
cd MCS-iOS
```

### 2. 配置 API 令牌

您需要一个有效的麦当劳中国 MCP API 令牌才能使用此应用。使用以下方法之一进行配置：

#### 选项 1：环境变量（推荐用于开发）

```bash
export MCD_MCP_TOKEN="your_token_here"
```

#### 选项 2：Config.plist 文件

在 `MCS-iOS/` 目录中创建 `Config.plist` 文件：

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

**注意**: `Config.plist` 文件已在 `.gitignore` 中，不会提交到版本控制。

### 3. 打开并构建

```bash
open MCS-iOS.xcodeproj
```

选择您的目标设备或模拟器，然后构建并运行（⌘R）。

## 架构

该应用遵循 **MVVM（Model-View-ViewModel）** 架构模式，具有清晰的关注点分离：

```
MCS-iOS/
├── MCSiOSApp.swift          # 应用入口点
├── Config.swift              # 配置管理
├── Models/                   # 数据模型
│   ├── Coupon.swift
│   ├── Campaign.swift
│   └── MCPResponse.swift
├── Services/                 # 网络层
│   ├── MCPClient.swift       # MCP API 客户端
│   ├── MCPError.swift        # 错误处理
│   └── MarkdownParser.swift  # 响应解析
├── ViewModels/               # 业务逻辑
│   ├── CouponViewModel.swift
│   └── CampaignViewModel.swift
└── Views/                    # SwiftUI UI 组件
    ├── ContentView.swift
    ├── MyCouponsView.swift
    ├── CampaignsView.swift
    ├── AvailableCouponsView.swift
    ├── CouponCardView.swift
    └── CampaignCardView.swift
```

## 核心组件

### 模型层

- **Coupon**: 表示麦当劳优惠券，包含过期逻辑和警告级别
- **Campaign**: 表示营销活动，包含状态跟踪
- **MCPResponse**: API 响应的包装类型

### 服务层

- **MCPClient**: 基于 Actor 的单例，用于线程安全的 MCP API 通信
  - 5 分钟响应缓存
  - Bearer 令牌身份验证
  - 处理网络、认证和速率限制错误
- **MarkdownParser**: 将 markdown 响应解析为结构化数据
- **MCPError**: 用户友好的本地化错误类型

### 视图模型层

- **CouponViewModel**: 管理优惠券状态和操作
  - 获取我的优惠券
  - 获取可领优惠券
  - 自动领取所有优惠券
  - 缓存刷新
- **CampaignViewModel**: 管理活动状态和筛选
  - 按日期获取活动
  - 按状态筛选
  - 搜索功能

### 视图层

- **ContentView**: 基于标签的导航
- **MyCouponsView**: 用户优惠券列表
- **CampaignsView**: 活动浏览器，带日期选择器和筛选器
- **AvailableCouponsView**: 可领取优惠券网格
- **CouponCardView**: 可重用的优惠券卡片组件
- **CampaignCardView**: 可重用的活动卡片组件

## API 集成

该应用与麦当劳中国 MCP 服务器通信，地址为：
```
https://mcp.mcd.cn/mcp-servers/mcd-mcp
```

### 可用的 MCP 工具

| 工具 | 用途 |
|------|---------|
| `my-coupons` | 获取用户已领取的优惠券（分页） |
| `available-coupons` | 获取可领取的优惠券 |
| `auto-bind-coupons` | 自动领取所有可用优惠券 |
| `campaign-calender` | 获取特定日期的活动 |
| `now-time-info` | 获取服务器时间信息 |

### 缓存

`MCPClient` 为 API 响应实现了 5 分钟缓存，以便：
- 减少服务器负载
- 提高应用响应速度
- 最小化网络使用

可以使用每个视图中的刷新按钮手动清除缓存。

## 功能详解

### 过期警告系统

优惠券根据过期时间显示颜色编码的警告：

- **红色**: 已过期或 < 3 天剩余（严重）
- **橙色**: < 7 天剩余（警告）
- **灰色**: 7+ 天剩余（正常）

### 活动状态跟踪

活动根据其日期范围自动分类：

- **进行中**: 当前日期在开始和结束日期之间
- **即将开始**: 开始日期在未来
- **已结束**: 结束日期已过
- **未知**: 日期信息不可用

### 错误处理

常见场景的用户友好错误消息：

- 网络连接问题
- 身份验证失败（无效令牌）
- 超过速率限制
- 服务器错误
- 无效响应

## 开发

### 代码风格

- Swift 5.9+ 配合现代并发（async/await）
- SwiftUI 用于声明式 UI
- Actor 模式用于线程安全
- MVVM 架构模式
- 清晰的关注点分离

### 测试

该应用包含全面的测试覆盖：
- 模型解码和计算属性
- 网络错误处理
- 响应解析
- 视图模型状态管理

运行测试：
```bash
xcodebuild test -scheme MCS-iOS -destination 'platform=iOS Simulator,name=iPhone 15'
```

## 故障排除

### 应用启动时崩溃

**原因**: 缺少或无效的 MCP 令牌

**解决方案**: 确保您已使用安装部分中描述的方法之一配置了令牌。

### 网络错误

**原因**: 无效令牌或网络连接问题

**解决方案**:
1. 验证您的令牌是否有效
2. 检查您的互联网连接
3. 尝试刷新视图

### 优惠券/活动列表为空

**原因**: 所选日期/用户没有可用数据

**解决方案**: 这是正常的 - 尝试不同的日期或领取一些优惠券！

## 贡献

1. Fork 仓库
2. 创建功能分支
3. 进行更改
4. 充分测试
5. 提交 pull request

## 许可证

本项目仅用于教育和开发目的。使用麦当劳中国 MCP API 时，请尊重其服务条款。

## 致谢

- 使用 SwiftUI 和现代 Swift 并发构建
- 灵感来自 macOS 版本（mcd-app）
- 使用模型上下文协议（MCP）进行 API 通信

## 相关项目

- **mcd-app**: 此应用程序的 macOS 版本
- **mcd-mcp**: 麦当劳中国 MCP 服务器

## 支持

如有问题、疑问或贡献，请在 GitHub 上开启 issue。
