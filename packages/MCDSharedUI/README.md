# MCDSharedUI

Shared SwiftUI components for McDonald's MCP client applications.

## Overview

MCDSharedUI provides reusable SwiftUI views and components used by both iOS and macOS applications, ensuring consistent UI across Apple platforms.

## Components

- `MyCouponsView` - List view displaying user's claimed coupons with expiry warnings
- `AvailableCouponsView` - Grid view for browsing and claiming available coupons
- `CouponCardView` - Reusable coupon card component with expiry indicators
- `CampaignCardView` - Reusable campaign card component with status badges

## Requirements

- iOS 17.0+ / macOS 14.0+
- Swift 5.9+
- Depends on MCDCore

## Installation

Add as a local dependency in your Package.swift:

```swift
dependencies: [
    .package(path: "../../packages/MCDCore"),
    .package(path: "../../packages/MCDSharedUI")
]
```

## Testing

Run the test suite:

```bash
swift test --package-path packages/MCDSharedUI
```

Tests cover component rendering and behavior.

## License

Private - Part of mcd-app monorepo
