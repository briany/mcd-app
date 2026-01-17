# McDonald's MCP macOS App

A native macOS application for managing McDonald's coupons and campaigns through the MCP (Model Context Protocol) API.

## Features

- **My Coupons**: View and manage your available McDonald's coupons
- **Campaigns**: Browse current McDonald's marketing campaigns and calendar
- **Available Coupons**: Discover and claim new coupons from McDonald's promotions

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
MCDApp/
├── Package.swift           # Swift package manifest
├── README.md              # This file
├── MCDApp/                # Main application code
│   ├── MCDApp.swift       # App entry point
│   ├── Models/            # Data models
│   │   ├── Coupon.swift
│   │   ├── Campaign.swift
│   │   └── TimeInfo.swift
│   ├── Services/          # API client
│   │   └── MCPClient.swift
│   ├── ViewModels/        # Business logic
│   │   ├── CouponViewModel.swift
│   │   └── CampaignViewModel.swift
│   └── Views/             # SwiftUI views
│       ├── ContentView.swift
│       ├── CouponListView.swift
│       ├── CampaignCalendarView.swift
│       └── AvailableCouponsView.swift
└── MCDAppTests/           # Test suite
    ├── ModelTests.swift
    ├── MCPClientTests.swift
    ├── ViewModelTests.swift
    └── IntegrationTests.swift
```

## Configuration

The app connects to the McDonald's MCP API using the endpoint configured in `~/.mcp.json`. Ensure this file is properly configured with your MCP server details.

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
