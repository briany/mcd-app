English | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

# MCD-App Monorepo

A multi-platform McDonald's MCP (Model Context Protocol) client application suite with shared Swift packages.

## Overview

This monorepo contains three platform-specific applications that share core business logic and UI components through Swift Package Manager (SPM) packages.

### Applications

- **[macOS App](apps/macos/README.md)** - Native macOS application
- **[iOS App](apps/ios/README.md)** - Native iOS application
- **[Web App](apps/web/README.md)** - Next.js web application

### Shared Packages

- **[MCDCore](packages/MCDCore/)** - Core business logic (models, services, view models)
- **[MCDSharedUI](packages/MCDSharedUI/)** - Shared SwiftUI components

## Screenshots

See the MCD-App suite in action across all platforms:

### Web Application
<img src="docs/images/web/dashboard.png" width="800" alt="Web Dashboard">

*Dashboard showing My Coupons, Available Coupons, and Campaign Radar*

### macOS Application
<img src="docs/images/macos/app-overview.png" width="600" alt="macOS App">

*Native macOS app with SwiftUI interface*

### iOS Application
<img src="docs/images/ios/my-coupons.png" width="300" alt="iOS My Coupons">

*iOS app showing coupon list with expiry tracking*

## Quick Start

### Prerequisites

- **Swift Apps:** Xcode 15+ and macOS 14+ or iOS 17+
- **Web App:** Node.js 20+ and npm

### Running Applications

**macOS:**
```bash
cd apps/macos/MCD-macOS
swift run
```

**iOS:**
```bash
open apps/ios/MCD-iOS/MCD-iOS.xcodeproj
# Build and run in Xcode (Cmd+R)
```

**Web:**
```bash
cd apps/web
npm install
npm run dev
```

## Configuration

All applications require an MCP token. See individual app READMEs for platform-specific configuration:

- [macOS Configuration](apps/macos/README.md#configuration)
- [iOS Configuration](apps/ios/README.md#configuration)
- [Web Configuration](apps/web/README.md#configuration)

## Architecture

See [Architecture Overview](docs/architecture/overview.md) for system design and [SPM Workspace Guide](docs/architecture/spm-workspace.md) for package structure.

## Recent Changes

### Security Enhancements (Web App)

The web application has undergone a comprehensive 4-phase security overhaul:

- **Phase 1 - Authentication & CSRF Protection**: Added NextAuth.js authentication with session management, CSRF token validation for state-changing operations, protected API routes, and a sign-in page
- **Phase 2 - Rate Limiting & Input Validation**: Implemented API rate limiting with configurable thresholds, input validation schemas using Zod, and request body sanitization
- **Phase 3 - Security Headers & Logging**: Added Content Security Policy (CSP), CORS protection, request body size limits, and structured security logging
- **Phase 4 - Additional Hardening**: Implemented safe regex patterns to prevent ReDoS attacks, response caching headers, and client-side cache management

### Test Coverage Improvements

- **Web App**: Expanded test coverage from 12% to 70%+ with 72 passing unit tests
- Added comprehensive API route tests, component tests, and hook tests
- Implemented E2E tests using Playwright with security header verification
- Added multi-layered lint error prevention system

### CI/CD Enhancements

- Added Claude Code GitHub workflow for automated assistance
- Updated iOS simulator target to iPhone 16 Pro for builds
- Added NEXTAUTH_SECRET environment variable for web builds and E2E tests
- Fixed E2E test stability by separating auth from security headers

### Platform-Specific Improvements

- **iOS**: Fixed excessive spacing between coupon cards
- **macOS**: Added Config.plist as bundled resource for easier dev setup
- **Web**: Fixed Next.js inline scripts compatibility with CSP

## Development

See [AGENTS.md](AGENTS.md) for development guidelines and coding standards.

## Testing & CI

The project includes comprehensive test coverage across all platforms:

### Swift Packages
- **MCDCore**: Unit tests for models, services, view models, and markdown parsing
- **MCDSharedUI**: Component tests for SwiftUI views

```bash
# Test MCDCore
swift test --package-path packages/MCDCore

# Test MCDSharedUI
swift test --package-path packages/MCDSharedUI
```

### Web App
- **72 passing unit tests** using Vitest
- **E2E tests** using Playwright
- **Component tests** using Testing Library

```bash
cd apps/web
npm test              # Unit tests
npm run test:e2e      # E2E tests
```

### Continuous Integration

GitHub Actions workflow runs on every push:
- Tests all Swift packages (MCDCore, MCDSharedUI)
- Builds iOS app (iPhone 17 Pro simulator)
- Builds macOS app
- Tests and builds web app (lint, unit tests, E2E, production build)

All platforms must pass CI checks before merging.

## Project Structure

```
mcd-app/
├── apps/                   # Platform-specific applications
│   ├── ios/               # iOS app
│   ├── macos/             # macOS app
│   └── web/               # Next.js web app
├── packages/              # Shared Swift packages
│   ├── MCDCore/          # Core business logic
│   └── MCDSharedUI/      # Shared UI components
└── docs/                  # Documentation
    ├── architecture/      # Architecture docs
    ├── guides/           # Developer guides
    └── plans/            # Design documents
```

## License

Private project - All rights reserved
