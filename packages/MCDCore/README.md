# MCDCore

Core business logic package for McDonald's MCP client applications.

## Overview

MCDCore provides shared models, services, and view models used by both iOS and macOS applications. This package handles all MCP API communication, data parsing, and business logic.

## Components

### Models
- `Coupon` - McDonald's coupon data with expiry tracking
- `Campaign` - Marketing campaign data with status tracking
- `MCPResponse` - Generic API response wrappers
- `TimeInfo` - Server time information

### Services
- `MCPClient` - Actor-based API client with 5-minute response caching
- `MCPError` - Typed error handling with localized messages
- `MarkdownParser` - Parses MCP API markdown responses into structured data

### ViewModels
- `CouponViewModel` - Manages coupon state and operations (fetch, claim, refresh)
- `CampaignViewModel` - Manages campaign data and filtering

## Requirements

- iOS 17.0+ / macOS 14.0+
- Swift 5.9+

## Installation

This package is used as a local dependency in the monorepo:

```swift
dependencies: [
    .package(path: "../../packages/MCDCore")
]
```

## Testing

Run the test suite:

```bash
swift test --package-path packages/MCDCore
```

Tests cover:
- Model decoding and computed properties
- Network error handling
- Response parsing
- ViewModel state management
- Integration scenarios

## License

Private - Part of mcd-app monorepo
