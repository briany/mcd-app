[English](README.md) | 简体中文 | [繁體中文](README.zh-TW.md)

# MCD-Web - 麦当劳 MCP Web 应用

一个使用 MCP（模型上下文协议）API 管理麦当劳中国优惠券和营销活动的 Next.js Web 应用程序。

## 功能特性

- **我的优惠券**: 查看和管理您已领取的麦当劳优惠券并跟踪过期时间
- **可领优惠券**: 发现并领取麦当劳促销活动的新优惠券
- **营销活动**: 浏览麦当劳营销活动，支持日期选择和筛选

## 技术栈

- **框架**: Next.js 16.1.3 with App Router
- **UI 库**: React 19.2.3
- **样式**: Tailwind CSS 4
- **状态管理**:
  - TanStack Query v5（服务器状态）
  - Zustand 5.0（客户端状态）
- **语言**: TypeScript 5
- **测试**: Vitest（单元测试）+ Playwright（E2E）

## 系统要求

- Node.js 20.11.1（在 `.nvmrc` 中指定）
- npm

## 设置

```bash
cd apps/web
nvm use   # 从 .nvmrc 使用 Node 20.11.1
npm install
```

### 环境变量

复制 `.env.example` 到 `.env.local` 并配置：

```bash
cp .env.example .env.local
```

必需的环境变量：
- `MCD_MCP_TOKEN` - 您的麦当劳中国 MCP API 令牌

**安全提示**: MCP API 令牌仅保存在服务器端。切勿将 `MCD_MCP_TOKEN` 暴露给客户端包。

## 开发

启动开发服务器：

```bash
npm run dev
```

其他有用的命令：

- `npm run build` - 生产构建
- `npm run start` - 启动生产服务器
- `npm run lint` - 运行 ESLint（零警告策略）
- `npm test` - 运行 Vitest 单元测试
- `npm run test:watch` - 监视模式运行测试
- `npm run test:e2e` - 运行 Playwright E2E 测试

## 项目结构

```
web/
├── src/
│   ├── app/
│   │   ├── api/              # API 路由（服务器端 MCP 调用）
│   │   │   ├── available-coupons/
│   │   │   ├── auto-claim/
│   │   │   ├── campaigns/
│   │   │   └── coupons/
│   │   ├── available/        # 可领优惠券页面
│   │   ├── campaigns/        # 营销活动页面
│   │   ├── coupons/          # 我的优惠券页面
│   │   ├── globals.css       # Tailwind CSS 配置
│   │   ├── layout.tsx        # 根布局
│   │   └── page.tsx          # 首页
│   ├── components/           # 可重用 React 组件
│   ├── hooks/                # 自定义 React Hooks（useCoupons 等）
│   └── lib/                  # 实用工具和配置
└── tests/                    # 测试文件
    ├── api/                  # API 路由测试
    ├── components/           # 组件测试
    ├── hooks/                # Hook 测试
    └── lib/                  # 实用工具测试
```

## API 集成

此应用通过服务器端 API 路由与麦当劳中国 MCP 服务器通信：

```
https://mcp.mcd.cn/mcp-servers/mcd-mcp
```

### API 路由

| 路由 | MCP 工具 | 用途 |
|-------|----------|---------|
| `/api/coupons` | `my-coupons` | 获取用户已领取的优惠券 |
| `/api/available-coupons` | `available-coupons` | 获取可领取的优惠券 |
| `/api/auto-claim` | `auto-bind-coupons` | 自动领取所有优惠券 |
| `/api/campaigns` | `campaign-calender` | 按日期获取营销活动 |

所有 API 调用包含 Bearer 令牌认证并适当缓存。

## 测试

### 单元测试（Vitest）

目前有 **72 个通过的测试**，涵盖：
- API 路由处理程序
- MCP 客户端功能
- React Hooks
- UI 组件

运行测试：
```bash
npm test
```

### E2E 测试（Playwright）

端到端测试覆盖关键用户流程：
- 查看和领取优惠券
- 浏览营销活动
- 导航和路由

运行 E2E 测试：
```bash
npm run test:e2e
```

## 架构说明

- **App Router**: 使用 Next.js 14+ App Router 与 React Server Components
- **服务器端 MCP 调用**: 所有 MCP API 请求都在 API 路由中进行（永不在客户端）
- **TanStack Query**: 管理服务器状态、缓存和自动重新获取
- **Tailwind CSS**: 实用优先的样式与全局配置
- **类型安全**: 完整的 TypeScript 覆盖，启用严格模式

## 相关应用

- **iOS 应用** (`apps/ios/`) - 原生 iOS 版本
- **macOS 应用** (`apps/macos/`) - 原生 macOS 版本

两个原生应用通过 Swift 包（MCDCore、MCDSharedUI）共享业务逻辑。

## 许可证

私有项目 - 保留所有权利
