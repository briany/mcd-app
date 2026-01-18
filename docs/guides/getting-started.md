# Getting Started

## Prerequisites

### For Swift Apps (macOS/iOS)
- macOS 14.0 or later
- Xcode 15.0 or later
- Swift 5.9 or later

### For Web App
- Node.js 20.0 or later
- npm 10.0 or later

## Initial Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd mcd-app
```

### 2. Configure MCP Token

You'll need an MCP API token. See [Configuration Guide](configuration.md) for platform-specific setup.

### 3. Choose Your Platform

Select the platform you want to develop for:

## macOS Development

### Build Shared Packages

```bash
# Build MCDCore
cd packages/MCDCore
swift build
swift test

# Build MCDSharedUI
cd ../MCDSharedUI
swift build
```

### Build and Run macOS App

```bash
cd ../../apps/macos/MCD-macOS
swift run
```

The app will launch and connect to the MCP API.

### Development Workflow

1. Make changes to shared packages or app code
2. Run `swift build` to compile
3. Run `swift test` to run tests (optional)
4. Run `swift run` to launch app

## iOS Development

### Open Xcode Project

```bash
open apps/ios/MCD-iOS/MCD-iOS.xcodeproj
```

### Add Package Dependencies (First Time Only)

If packages aren't linked:
1. In Xcode: File → Add Package Dependencies → Add Local
2. Navigate to `packages/MCDCore` → Add Package
3. Repeat for `packages/MCDSharedUI`

### Build and Run

1. Select a simulator or device from the scheme picker
2. Press Cmd+R to build and run

### Development Workflow

1. Make changes in Xcode
2. Build (Cmd+B) to check for errors
3. Run (Cmd+R) to test on simulator/device

## Web Development

### Install Dependencies

```bash
cd apps/web
npm install
```

### Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local and add your MCP_TOKEN
```

### Start Development Server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

### Development Workflow

```bash
# Run dev server
npm run dev

# Run tests
npm test

# Run linter
npm run lint

# Build for production
npm run build
```

## Project Structure

```
mcd-app/
├── apps/                 # Platform apps
│   ├── ios/             # iOS app (Xcode project)
│   ├── macos/           # macOS app (SPM package)
│   └── web/             # Web app (Next.js)
├── packages/            # Shared Swift packages
│   ├── MCDCore/        # Business logic
│   └── MCDSharedUI/    # UI components
└── docs/               # Documentation
```

## Common Tasks

### Run All Tests

**Swift:**
```bash
# Test MCDCore
cd packages/MCDCore && swift test

# Test macOS app
cd apps/macos/MCD-macOS && swift test
```

**Web:**
```bash
cd apps/web
npm test              # Unit tests
npm run test:e2e      # E2E tests
```

### Clean Build Artifacts

**Swift:**
```bash
# Clean package builds
cd packages/MCDCore && rm -rf .build
cd packages/MCDSharedUI && rm -rf .build

# Clean app builds
cd apps/macos/MCD-macOS && rm -rf .build

# Or use Xcode for iOS: Product → Clean Build Folder (Shift+Cmd+K)
```

**Web:**
```bash
cd apps/web
rm -rf .next node_modules
npm install
```

## Next Steps

- **Configure tokens:** See [Configuration Guide](configuration.md)
- **Understand architecture:** Read [Architecture Overview](../architecture/overview.md)
- **Learn testing:** Check [Testing Guide](testing.md)
- **Development standards:** Review [AGENTS.md](../../AGENTS.md)

## Troubleshooting

### Swift Package Resolution Issues

If you see "package not found" errors:
```bash
# Clean derived data
rm -rf ~/Library/Developer/Xcode/DerivedData

# Rebuild packages
cd packages/MCDCore && swift build
cd packages/MCDSharedUI && swift build
```

### Xcode Can't Find Packages

1. Close Xcode
2. Delete derived data: `rm -rf ~/Library/Developer/Xcode/DerivedData`
3. Reopen Xcode project
4. File → Packages → Resolve Package Versions

### Web App Build Failures

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```
