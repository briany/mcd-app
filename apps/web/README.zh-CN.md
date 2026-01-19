[English](README.md) | 简体中文 | [繁體中文](README.zh-TW.md)

这个 Next.js 工作空间镜像了 macOS 和 iOS MCP 客户端的功能，为优惠券、营销活动和发现流程提供浏览器界面。

## 设置

```bash
cd web
nvm use   # 根据 .nvmrc 安装/使用 Node 20.11.1
npm install
```

环境变量保存在 `.env.local` 中（参见 `.env.example`，稍后在计划中添加）。开发服务器运行命令：

```bash
npm run dev
```

其他有用的脚本：

- `npm run lint` – Next.js + ESLint 规则
- `npm run test` / `npm run test:watch` – Vitest 单元测试
- `npm run test:e2e` – Playwright 冒烟测试套件

## 开发说明

- 该项目使用 App Router 和 `src/app` 内的同位路由目录。
- Tailwind CSS 在 `src/app/globals.css` 中全局配置。
- MCP API 令牌保留在服务器端；切勿将 `MCD_MCP_TOKEN` 暴露给客户端包。
