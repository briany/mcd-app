[English](README.md) | [简体中文](README.zh-CN.md) | 繁體中文

這個 Next.js 工作空間鏡像了 macOS 和 iOS MCP 客戶端的功能，為優惠券、行銷活動和探索流程提供瀏覽器介面。

## 設定

```bash
cd web
nvm use   # 根據 .nvmrc 安裝/使用 Node 20.11.1
npm install
```

環境變數儲存在 `.env.local` 中（參見 `.env.example`，稍後在計畫中新增）。開發伺服器執行指令：

```bash
npm run dev
```

其他有用的指令碼：

- `npm run lint` – Next.js + ESLint 規則
- `npm run test` / `npm run test:watch` – Vitest 單元測試
- `npm run test:e2e` – Playwright 冒煙測試套件

## 開發說明

- 該專案使用 App Router 和 `src/app` 內的同位路由目錄。
- Tailwind CSS 在 `src/app/globals.css` 中全域設定。
- MCP API 權杖保留在伺服器端；切勿將 `MCD_MCP_TOKEN` 暴露給客戶端套件。
