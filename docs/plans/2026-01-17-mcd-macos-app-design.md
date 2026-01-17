# McDonald's MCP macOS App Design

**Date:** 2026-01-17
**Status:** Approved for Implementation

## Overview

A native macOS application that integrates with McDonald's China MCP server to provide coupon management and campaign tracking functionality.

## Technology Stack

- **Platform:** macOS (SwiftUI + Swift)
- **Architecture:** MVVM (Model-View-ViewModel)
- **Networking:** URLSession with async/await
- **MCP Integration:** Direct HTTP calls to `https://mcp.mcd.cn/mcp-servers/mcd-mcp`

## App Architecture

### Core Layers

1. **Views (SwiftUI)**
   - Tab-based UI with three main tabs
   - Native macOS appearance with light/dark mode support
   - Minimum window size: 800x600

2. **ViewModels**
   - `CouponViewModel` - Manages coupon state and operations
   - `CampaignViewModel` - Handles campaign data
   - Observable objects with `@Published` properties

3. **Models**
   - `Coupon` - Coupon data structure
   - `Campaign` - Campaign data structure
   - `MCPResponse` - Generic API response wrapper

4. **Networking Layer**
   - `MCPClient` - Singleton service for all MCP API calls
   - `MCPError` - Custom error enum
   - Response caching (5-minute TTL)

## UI Structure

### Tab 1: My Coupons
- List view with coupon cards
- Display: image, name, expiry date, status
- Expiry color coding:
  - Red: < 3 days remaining
  - Yellow: < 7 days remaining
  - Default: normal
- Pull-to-refresh gesture
- Toolbar: Refresh button
- Empty state message

### Tab 2: Campaigns
- Date picker for specific date selection
- Segmented control: Ongoing | Past | Upcoming
- Campaign cards with:
  - Title
  - Date range
  - Description
  - Subscription status
- Search bar for filtering
- List view with campaign details

### Tab 3: Available Coupons
- Grid/List of claimable coupons
- Each item: preview + "Claim" button
- Toolbar: "Claim All" button
- Success/error alerts
- Auto-refresh after claiming

## API Integration

### MCPClient Configuration
- Base URL: `https://mcp.mcd.cn/mcp-servers/mcd-mcp`
- Auth Token: Bearer authentication
- Request format: MCP protocol (JSON POST)
- Rate limit: 600 requests/minute

### API Methods

1. **fetchMyCoupons(page: Int, pageSize: Int)**
   - Tool: `my-coupons`
   - Returns: Paginated list of owned coupons
   - Max page size: 200

2. **fetchAvailableCoupons()**
   - Tool: `available-coupons`
   - Returns: List of claimable coupons

3. **autoClaimCoupons()**
   - Tool: `auto-bind-coupons`
   - Claims all available coupons automatically

4. **fetchCampaigns(date: String?)**
   - Tool: `campaign-calender`
   - Returns: Campaigns for specified date
   - Date format: yyyy-MM-dd

5. **getCurrentTime()**
   - Tool: `now-time-info`
   - Returns: Server time information

### Error Handling

- Network failures: Show retry option
- Authentication errors: Alert about token issues
- Rate limiting: Queue requests with delays
- Parse errors: User-friendly error messages

## Data Flow

1. **App Launch**
   - Initialize MCPClient
   - Load "My Coupons" tab by default
   - Fetch initial coupon data

2. **Coupon Management**
   - User views coupons → ViewModel fetches from MCPClient
   - User claims coupon → API call → Update local state
   - Auto-refresh after 5 minutes (cache expiry)

3. **Campaign Browsing**
   - User selects date → Fetch campaigns for date
   - User searches → Filter local data
   - Segmented control → Filter by status

## Visual Design

- **Theme:** Native macOS (System colors)
- **Icons:** SF Symbols
- **Typography:** System font (San Francisco)
- **Spacing:** Standard macOS HIG guidelines
- **Colors:**
  - Expiry warnings: System red/yellow
  - Success: System green
  - Default: System accent color

## Non-Functional Requirements

- **Performance:** UI remains responsive during API calls
- **Caching:** 5-minute cache for API responses
- **Accessibility:** VoiceOver support via SwiftUI defaults
- **Localization:** English initially (Chinese support TBD)

## Out of Scope (V1)

- Background auto-claiming service
- Push notifications
- Menu bar presence
- macOS widget
- Settings/preferences panel
- Custom token management (hardcoded initially)

## Implementation Notes

- Use async/await for all network calls
- Leverage SwiftUI's declarative syntax
- Follow Swift naming conventions
- Add basic error logging for debugging
- Test with provided MCP token: `1t8EuirFCyleKY9dCeBAMOXUsMnzYcj2`
