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

## Screenshot

<img src="../../docs/images/web/dashboard.png" width="800" alt="Web Dashboard">

*Dashboard showing My Coupons, Available Coupons, and Campaign Radar with real-time MCP data*

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

## Security

This application implements multiple layers of security protection:

### Authentication & Authorization

**Token Management**:
- MCP API tokens stored server-side only in environment variables
- Never exposed to client bundle
- Bearer token authentication on all MCP API calls

**Environment Variables**:
```bash
MCD_MCP_TOKEN=your-token-here  # Required, server-side only
```

### Error Handling

**Environment-Aware Error Responses**:
- **Development**: Full error details with stack traces for debugging
- **Production**: Sanitized errors hiding sensitive information

**Security Event Logging**:
```typescript
// Logged events include:
// - Request metadata (method, URL, IP, user agent)
// - API errors (including authentication)
// - Validation errors
```

### Security Headers

**Implemented via Next.js Middleware** (`src/middleware.ts`):

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `DENY` | Prevents clickjacking attacks |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-sniffing attacks |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Protects referrer information |
| `Permissions-Policy` | Restrictive | Disables unnecessary browser features |
| `Content-Security-Policy` | Restrictive CSP | Prevents XSS attacks |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Enforces HTTPS (production only) |

**CSP Configuration**:
- Allows `'unsafe-inline'` and `'unsafe-eval'` for Next.js functionality
- Restricts image sources to MCD CDN domains
- Blocks all frame embedding (`frame-ancestors 'none'`)
- Self-only for scripts, styles, and connections

### Request Protection

**Body Size Limits**:
- Default: 1MB for all requests (configured in `next.config.ts`)
- Auto-claim endpoint: 512KB (using `withBodySizeLimit` wrapper)
- Returns 413 status with clear error message when exceeded

**CORS Configuration**:
- Allowed origins: `http://localhost:3000`, production domain
- Credentials supported for allowed origins only
- Preflight requests (OPTIONS) validated before processing
- Disallowed origins receive 403 Forbidden
- OPTIONS preflight handlers configured for `/api/coupons` route
- Middleware applies CORS headers globally to all responses

### Input Validation

API endpoints validate where applicable:
- Request body structure and types
- Required fields presence
- Data format correctness

Invalid requests return:
- 400 Bad Request status
- Clear error message describing the issue
- No sensitive information exposure

### Monitoring

**Security Events**:
The application logs security-relevant events for monitoring:
- API request failures
- Invalid input attempts
- CORS violations
- Request size limit violations

**Development Logging**:
```bash
# In development, detailed logs appear in console
[Request] { method: 'POST', url: '/api/coupons', ip: '127.0.0.1', ... }
```

**Production Logging**:
In production, configure log aggregation to:
- Monitor security events
- Detect attack patterns
- Trigger alerts for suspicious activity

### Security Best Practices

**For Developers**:
1. Never commit `.env.local` or expose `MCD_MCP_TOKEN`
2. Always use API routes (server-side) for MCP calls, never client-side
3. Test error handling in both development and production modes
4. Review security headers in browser DevTools
5. Update allowed CORS origins in middleware.ts when deploying to new domains

**For Deployment**:
1. Set `NODE_ENV=production` in production environment
2. Enable HTTPS to activate HSTS header
3. Set up log aggregation for security monitoring
4. Regularly rotate MCP API tokens

**For Testing**:
```bash
# Verify security headers
curl -I http://localhost:3000

# Test CORS (should return 403 for evil.com)
curl -H "Origin: http://evil.com" -I http://localhost:3000

# Test body size limit (should return 413)
curl -X POST http://localhost:3000/api/available-coupons/auto-claim \
  -H "Content-Type: application/json" \
  -d @large-file.json  # > 512KB
```

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
