English | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

# McDonald's MCP macOS App

A native macOS application for managing McDonald's coupons and campaigns through the MCP (Model Context Protocol) API.

## Monorepo Structure

This macOS app is part of the mcd-app monorepo and shares core business logic with the iOS app through Swift Package Manager packages:

- **MCDCore** (`../../packages/MCDCore`) - Shared models, services, and view models
- **MCDSharedUI** (`../../packages/MCDSharedUI`) - Shared SwiftUI components

This architecture enables code reuse across Apple platforms while maintaining platform-specific builds.

## Features

- **My Coupons**: View and manage your available McDonald's coupons
- **Campaigns**: Browse current McDonald's marketing campaigns and calendar
- **Available Coupons**: Discover and claim new coupons from McDonald's promotions

## Screenshot

<img src="../../docs/images/macos/app-overview.png" width="700" alt="macOS App">

*Native macOS application showing the My Coupons view*

## Requirements

- macOS 14.0 or later
- Swift 5.9 or later
- Xcode 15.0 or later (for development)

## Building

To build the application:

```bash
swift build
```

For a release build with optimizations:

```bash
swift build -c release
```

## Running

To run the application:

```bash
swift run
```

The app will launch and connect to the McDonald's MCP API endpoint configured in your `~/.mcp.json` file.

## Architecture

This application follows the **MVVM (Model-View-ViewModel)** architecture pattern:

- **Models**: Data structures for Coupons, Campaigns, and API responses
- **Views**: SwiftUI views for the user interface (CouponListView, CampaignCalendarView, AvailableCouponsView)
- **ViewModels**: Business logic layer (CouponViewModel, CampaignViewModel)
- **Services**: API client (MCPClient) using URLSession for network communication

### Technology Stack

- **SwiftUI**: Modern declarative UI framework
- **Swift Concurrency**: async/await for asynchronous operations
- **URLSession**: Native networking layer
- **MCP API**: McDonald's Model Context Protocol integration

## Project Structure

```
MCD-macOS/
├── Package.swift              # SPM package manifest
├── README.md                  # This file
└── Sources/
    └── MCDApp/
        ├── MCDApp.swift       # App entry point
        └── ContentView.swift  # Main view (tab navigation)

Dependencies (SPM):
├── MCDCore (../../packages/MCDCore)
│   ├── Models/               # Coupon, Campaign, TimeInfo
│   ├── Services/             # MCPClient, MarkdownParser, MCPError
│   └── ViewModels/           # CouponViewModel, CampaignViewModel
└── MCDSharedUI (../../packages/MCDSharedUI)
    └── Views/                # MyCouponsView, AvailableCouponsView, etc.
```

The shared packages contain all business logic and most UI, allowing the macOS app to focus on app configuration and platform integration.

## Configuration

### API Token Setup

You need a McDonald's China MCP API token. Configure it using one of these methods:

**Option A: Setup Script (Recommended for Development)**
```bash
# From the monorepo root, run the setup script
./scripts/setup-config.sh

# Edit the created Config.plist and add your token
# The file is at: apps/macos/MCD-macOS/MCDApp/Config.plist
```

**Option B: Environment Variable**
```bash
export MCD_MCP_TOKEN=your_token_here
swift run
```

**Option C: Manual Config File**
```bash
# Copy the template
cp ../Config.plist.example MCD-macOS/MCDApp/Config.plist

# Edit Config.plist and replace YOUR_TOKEN_HERE with your actual token
```

> ⚠️ **Security Note**: Never commit `Config.plist` or `.mcp.json` to git. These files are in `.gitignore` and will not be included in production releases.

## Testing

Run the test suite:

```bash
swift test
```

The test suite includes:
- Model decoding tests
- ViewModel state tests
- MCPClient error handling tests
- Integration tests (skipped by default)

## License

Proprietary - McDonald's MCP Integration
