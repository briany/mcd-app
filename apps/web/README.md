English | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

# MCD-Web - McDonald's MCP Web App

A Next.js web application for managing McDonald's China coupons and campaigns using the MCP (Model Context Protocol) API.

## Features

- **My Coupons**: View and manage your claimed McDonald's coupons with expiry tracking
- **Available Coupons**: Discover and claim new coupons from McDonald's promotions
- **Campaigns**: Browse McDonald's marketing campaigns with date selection and filtering

## Technology Stack

- **Framework**: Next.js 16.1.3 with App Router
- **UI Library**: React 19.2.3
- **Styling**: Tailwind CSS 4
- **State Management**:
  - TanStack Query v5 (server state)
  - Zustand 5.0 (client state)
- **Language**: TypeScript 5
- **Testing**: Vitest (unit) + Playwright (E2E)

## Requirements

- Node.js 20.11.1 (specified in `.nvmrc`)
- npm

## Setup

```bash
cd apps/web
nvm use   # Uses Node 20.11.1 from .nvmrc
npm install
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Required environment variables:
- `MCD_MCP_TOKEN` - Your McDonald's China MCP API token

**Security Note**: MCP API tokens are kept server-side only. Never expose `MCD_MCP_TOKEN` to the client bundle.

## Development

Start the development server:

```bash
npm run dev
```

Other useful commands:

- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (with zero warnings policy)
- `npm test` - Run Vitest unit tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:e2e` - Run Playwright E2E tests

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/              # API routes (server-side MCP calls)
│   │   │   ├── available-coupons/
│   │   │   ├── auto-claim/
│   │   │   ├── campaigns/
│   │   │   └── coupons/
│   │   ├── available/        # Available Coupons page
│   │   ├── campaigns/        # Campaigns page
│   │   ├── coupons/          # My Coupons page
│   │   ├── globals.css       # Tailwind CSS config
│   │   ├── layout.tsx        # Root layout
│   │   └── page.tsx          # Home page
│   ├── components/           # Reusable React components
│   ├── hooks/                # Custom React hooks (useCoupons, etc.)
│   └── lib/                  # Utilities and configuration
└── tests/                    # Test files
    ├── api/                  # API route tests
    ├── components/           # Component tests
    ├── hooks/                # Hook tests
    └── lib/                  # Utility tests
```

## API Integration

This app communicates with the McDonald's China MCP server via server-side API routes:

```
https://mcp.mcd.cn/mcp-servers/mcd-mcp
```

### API Routes

| Route | MCP Tool | Purpose |
|-------|----------|---------|
| `/api/coupons` | `my-coupons` | Fetch user's claimed coupons |
| `/api/available-coupons` | `available-coupons` | Fetch claimable coupons |
| `/api/auto-claim` | `auto-bind-coupons` | Auto-claim all coupons |
| `/api/campaigns` | `campaign-calender` | Fetch campaigns by date |

All API calls include Bearer token authentication and are cached appropriately.

## Testing

### Unit Tests (Vitest)

Currently **72 passing tests** covering:
- API route handlers
- MCP client functionality
- React hooks
- UI components

Run tests:
```bash
npm test
```

### E2E Tests (Playwright)

End-to-end tests covering critical user flows:
- Viewing and claiming coupons
- Browsing campaigns
- Navigation and routing

Run E2E tests:
```bash
npm run test:e2e
```

## Architecture Notes

- **App Router**: Uses Next.js 14+ App Router with React Server Components
- **Server-side MCP calls**: All MCP API requests happen in API routes (never client-side)
- **TanStack Query**: Manages server state, caching, and automatic refetching
- **Tailwind CSS**: Utility-first styling with global configuration
- **Type Safety**: Full TypeScript coverage with strict mode enabled

## Related Apps

- **iOS App** (`apps/ios/`) - Native iOS version
- **macOS App** (`apps/macos/`) - Native macOS version

Both native apps share business logic through Swift packages (MCDCore, MCDSharedUI).

## License

Private project - All rights reserved
