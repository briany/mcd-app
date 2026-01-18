# Architecture Overview

## System Design

MCD-App is a multi-platform monorepo that eliminates code duplication through shared Swift packages while maintaining platform-specific UI/UX optimizations.

### Key Principles

1. **Single Source of Truth** - All business logic lives in MCDCore
2. **Shared UI Components** - Cross-platform views in MCDSharedUI
3. **Platform-Specific UX** - Each app optimizes for its platform
4. **Type Safety** - Swift's type system enforces consistency across platforms

## Architecture Layers

```
┌─────────────────────────────────────────────────────┐
│          Platform Applications Layer                │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ macOS    │  │ iOS      │  │ Web (Next.js)    │ │
│  │ (SwiftUI)│  │ (SwiftUI)│  │ (TypeScript)     │ │
│  └──────────┘  └──────────┘  └──────────────────┘ │
└────────────┬─────────┬─────────────────────────────┘
             │         │
             ▼         ▼
┌─────────────────────────────────────────────────────┐
│        Shared UI Components Layer (SwiftUI)         │
│              MCDSharedUI Package                    │
│  ┌──────────────┐  ┌──────────────┐               │
│  │ Card Views   │  │ List Views   │               │
│  └──────────────┘  └──────────────┘               │
└────────────────────────┬────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│         Core Business Logic Layer                   │
│               MCDCore Package                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ Models   │  │ Services │  │ViewModels│         │
│  └──────────┘  └──────────┘  └──────────┘         │
└─────────────────────────────────────────────────────┘
```

## Component Responsibilities

### MCDCore Package

**Purpose:** Core business logic shared across all platforms

**Contents:**
- **Models:** Data structures (Coupon, Campaign, MCPResponse)
- **Services:** API client (MCPClient), parsers (MarkdownParser), errors (MCPError)
- **ViewModels:** State management (@MainActor classes)
- **Configuration:** Shared config logic (MCDConfiguration)

**Platform Support:** iOS 17+, macOS 14+

### MCDSharedUI Package

**Purpose:** Reusable SwiftUI components

**Contents:**
- **Card Views:** CouponCardView, CampaignCardView
- **List Views:** MyCouponsView, AvailableCouponsView

**Dependencies:** MCDCore

**Platform Support:** iOS 17+, macOS 14+

### Platform Apps

**macOS App (apps/macos/MCD-macOS):**
- Native macOS UI with graphical date picker
- Window management optimized for desktop
- Keyboard shortcuts and menu bar integration

**iOS App (apps/ios/MCD-iOS):**
- Touch-optimized interface
- Modal sheets for date selection
- iOS-specific navigation patterns

**Web App (apps/web):**
- Next.js with TypeScript
- Server-side rendering
- Independent MCP client implementation

## Data Flow

```
User Input → ViewModel → MCPClient → MCP API
              ↓                         ↓
           @Published              JSON Response
              ↓                         ↓
         SwiftUI View ← Model ← MarkdownParser
```

## Code Duplication Elimination

**Before Restructuring:**
- ~17,800 LOC duplicated between macOS and iOS
- Separate copies of all models, services, view models, views
- Divergent implementations causing inconsistencies

**After Restructuring:**
- ~100 LOC platform-specific code per app
- 92% reduction in duplication
- Single source of truth guarantees consistency

## Testing Strategy

- **Unit Tests:** MCDCore package (models, services, view models)
- **Integration Tests:** MCPClient with live API (skipped by default)
- **UI Tests:** Platform-specific in each app
- **E2E Tests:** Web app with Playwright

See [Testing Guide](../guides/testing.md) for details.
