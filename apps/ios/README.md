English | [简体中文](README.zh-CN.md) | [繁體中文](README.zh-TW.md)

# MCD-iOS - McDonald's MCP iOS App

A native iOS application for managing McDonald's China coupons and campaigns using the MCP (Model Context Protocol) server.

## Monorepo Structure

This iOS app is part of the mcd-app monorepo and shares core business logic with the macOS app through Swift Package Manager packages:

- **MCDCore** (`../../packages/MCDCore`) - Shared models, services, and view models
- **MCDSharedUI** (`../../packages/MCDSharedUI`) - Shared SwiftUI components

This architecture enables code reuse across platforms while maintaining platform-specific UI implementations.

## Features

- **My Coupons**: View your claimed McDonald's coupons with expiry tracking
- **Campaigns**: Browse McDonald's marketing campaigns with date selection and filtering
- **Available Coupons**: Discover and claim new coupons with one-tap "Claim All" functionality

## Screenshots

### My Coupons
- View all claimed coupons
- Color-coded expiry warnings (Red: < 3 days, Orange: < 7 days)
- Days remaining until expiration
- Refresh to update coupon list

### Campaigns
- Date picker to select campaign dates
- Filter by status: All, Ongoing, Past, Upcoming
- Search campaigns by title or description
- View campaign details and subscription status

### Available Coupons
- Browse all claimable coupons
- Claim all coupons at once
- Automatic refresh after claiming

## Requirements

- iOS 17.0+
- Xcode 15.0+
- Swift 5.9+
- Valid McDonald's China MCP API token

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd MCD-iOS
```

### 2. Configure API Token

You need a valid McDonald's China MCP API token to use this app. Configure it using one of these methods:

#### Option 1: Environment Variable (Recommended for Development)

```bash
export MCD_MCP_TOKEN="your_token_here"
```

#### Option 2: Config.plist File

Create a `Config.plist` file in the `MCD-iOS/` directory:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>MCD_MCP_TOKEN</key>
    <string>your_token_here</string>
</dict>
</plist>
```

**Note**: The `Config.plist` file is in `.gitignore` and will not be committed to version control.

### 3. Open and Build

```bash
open MCD-iOS.xcodeproj
```

Select your target device or simulator, then build and run (⌘R).

## Architecture

The app follows the **MVVM (Model-View-ViewModel)** pattern with shared packages:

```
MCD-iOS/
├── MCD-iOS/
│   ├── MCD_iOSApp.swift      # App entry point
│   ├── Config.swift           # Configuration
│   ├── ContentView.swift      # Tab navigation
│   └── Views/
│       └── CampaignsView.swift # Campaign-specific view
│
├── Dependencies (SPM):
│   ├── MCDCore (../../packages/MCDCore)
│   │   ├── Models/           # Coupon, Campaign, etc.
│   │   ├── Services/         # MCPClient, MarkdownParser
│   │   └── ViewModels/       # Business logic
│   └── MCDSharedUI (../../packages/MCDSharedUI)
│       └── Views/            # MyCouponsView, AvailableCouponsView, etc.
```

## Key Components

### Models

- **Coupon**: Represents a McDonald's coupon with expiry logic and warning levels
- **Campaign**: Represents a marketing campaign with status tracking
- **MCPResponse**: Wrapper types for API responses

### Services

- **MCPClient**: Actor-based singleton for thread-safe MCP API communication
  - 5-minute response caching
  - Bearer token authentication
  - Error handling for network, auth, and rate limit issues
- **MarkdownParser**: Parses markdown responses into structured data
- **MCPError**: Localized error types for user-friendly messages

### ViewModels

- **CouponViewModel**: Manages coupon state and operations
  - Fetch my coupons
  - Fetch available coupons
  - Auto-claim all coupons
  - Cache refresh
- **CampaignViewModel**: Manages campaign state and filtering
  - Fetch campaigns by date
  - Filter by status
  - Search functionality

### Views

- **ContentView**: Tab-based navigation
- **MyCouponsView**: List of user's coupons
- **CampaignsView**: Campaign browser with date picker and filters
- **AvailableCouponsView**: Grid of claimable coupons
- **CouponCardView**: Reusable coupon card component
- **CampaignCardView**: Reusable campaign card component

## API Integration

The app communicates with the McDonald's China MCP server at:
```
https://mcp.mcd.cn/mcp-servers/mcd-mcp
```

### Available MCP Tools

| Tool | Purpose |
|------|---------|
| `my-coupons` | Fetch user's claimed coupons (paginated) |
| `available-coupons` | Fetch claimable coupons |
| `auto-bind-coupons` | Auto-claim all available coupons |
| `campaign-calender` | Fetch campaigns for a specific date |
| `now-time-info` | Get server time information |

### Caching

The `MCPClient` implements a 5-minute cache for API responses to:
- Reduce server load
- Improve app responsiveness
- Minimize network usage

Cache can be manually cleared using the refresh buttons in each view.

## Features in Detail

### Expiry Warning System

Coupons display color-coded warnings based on expiration:

- **Red**: Expired or < 3 days remaining (Critical)
- **Orange**: < 7 days remaining (Warning)
- **Gray**: 7+ days remaining (Normal)

### Campaign Status Tracking

Campaigns are automatically categorized based on their date range:

- **Ongoing**: Current date is between start and end dates
- **Upcoming**: Start date is in the future
- **Past**: End date has passed
- **Unknown**: Date information unavailable

### Error Handling

User-friendly error messages for common scenarios:

- Network connectivity issues
- Authentication failures (invalid token)
- Rate limit exceeded
- Server errors
- Invalid responses

## Development

### Code Style

- Swift 5.9+ with modern concurrency (async/await)
- SwiftUI for declarative UI
- Actor pattern for thread safety
- MVVM architectural pattern
- Clear separation of concerns

### Testing

The app includes comprehensive test coverage for:
- Model decoding and computed properties
- Network error handling
- Response parsing
- ViewModel state management

Run tests with:
```bash
xcodebuild test -scheme MCD-iOS -destination 'platform=iOS Simulator,name=iPhone 15'
```

## Troubleshooting

### App crashes on launch

**Cause**: Missing or invalid MCP token

**Solution**: Ensure you've configured the token using one of the methods described in the Installation section.

### Network errors

**Cause**: Invalid token or network connectivity issues

**Solution**:
1. Verify your token is valid
2. Check your internet connection
3. Try refreshing the view

### Empty coupon/campaign lists

**Cause**: No data available for the selected date/user

**Solution**: This is normal - try different dates or claim some coupons!

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is for educational and development purposes. Please respect McDonald's China's terms of service when using their MCP API.

## Acknowledgments

- Built with SwiftUI and modern Swift concurrency
- Inspired by the macOS version (mcd-app)
- Uses the Model Context Protocol (MCP) for API communication

## Related Projects

- **mcd-app**: The macOS version of this application
- **mcd-mcp**: The McDonald's China MCP server

## Support

For issues, questions, or contributions, please open an issue on GitHub.
