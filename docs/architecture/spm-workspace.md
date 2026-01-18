# Swift Package Manager Workspace

## Package Dependency Graph

```
                    ┌──────────────┐
                    │   Web App    │
                    │  (Next.js)   │
                    └──────────────┘
                          (independent)

┌──────────────┐                    ┌──────────────┐
│  macOS App   │                    │   iOS App    │
└───────┬──────┘                    └───────┬──────┘
        │                                   │
        └──────────┬────────────────────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │   MCDSharedUI        │
        │   (SwiftUI Views)    │
        └──────────┬───────────┘
                   │
                   ▼
        ┌──────────────────────┐
        │     MCDCore          │
        │  (Business Logic)    │
        └──────────────────────┘
```

## Package Manifests

### MCDCore (packages/MCDCore/Package.swift)

```swift
let package = Package(
    name: "MCDCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MCDCore", targets: ["MCDCore"])
    ],
    dependencies: [],  // No external dependencies
    targets: [
        .target(name: "MCDCore", path: "Sources/MCDCore"),
        .testTarget(name: "MCDCoreTests", dependencies: ["MCDCore"])
    ]
)
```

**Exports:**
- Models: `Coupon`, `Campaign`, `MCPResponse`, `TimeInfo`
- Services: `MCPClient` (actor), `MCPError`, `MarkdownParser`
- ViewModels: `CouponViewModel`, `CampaignViewModel` (@MainActor)
- Configuration: `MCDConfiguration`

### MCDSharedUI (packages/MCDSharedUI/Package.swift)

```swift
let package = Package(
    name: "MCDSharedUI",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MCDSharedUI", targets: ["MCDSharedUI"])
    ],
    dependencies: [
        .package(path: "../MCDCore")
    ],
    targets: [
        .target(name: "MCDSharedUI", dependencies: ["MCDCore"])
    ]
)
```

**Exports:**
- Components: `CouponCardView`, `CampaignCardView`, `MyCouponsView`, `AvailableCouponsView`

## App Integration

### macOS App (apps/macos/MCD-macOS/Package.swift)

```swift
let package = Package(
    name: "MCD-macOS",
    dependencies: [
        .package(path: "../../../packages/MCDCore"),
        .package(path: "../../../packages/MCDSharedUI")
    ],
    targets: [
        .executableTarget(
            name: "MCDApp",
            dependencies: [
                .product(name: "MCDCore", package: "MCDCore"),
                .product(name: "MCDSharedUI", package: "MCDSharedUI")
            ]
        )
    ]
)
```

### iOS App (Xcode Project)

iOS uses Xcode project files instead of SPM manifests. Packages are added via:
1. File → Add Package Dependencies → Add Local
2. Select `../../packages/MCDCore`
3. Select `../../packages/MCDSharedUI`

## Directory Structure

```
packages/
├── MCDCore/
│   ├── Package.swift
│   ├── Sources/
│   │   └── MCDCore/
│   │       ├── Models/
│   │       ├── Services/
│   │       ├── ViewModels/
│   │       └── Configuration/
│   └── Tests/
│       └── MCDCoreTests/
└── MCDSharedUI/
    ├── Package.swift
    ├── Sources/
    │   └── MCDSharedUI/
    │       └── Components/
    └── Tests/
        └── MCDSharedUITests/
```

## Building Packages

### Build MCDCore
```bash
cd packages/MCDCore
swift build
swift test
```

### Build MCDSharedUI
```bash
cd packages/MCDSharedUI
swift build
# (Tests require MCDCore to be built first)
```

### Build macOS App
```bash
cd apps/macos/MCD-macOS
swift build
swift run
```

## Public API Guidelines

All exports from shared packages must use `public` visibility:

```swift
// Models
public struct Coupon: Identifiable, Codable, Hashable {
    public let id: String
    public init(id: String, ...) { ... }
}

// Services
public actor MCPClient {
    public static let shared = MCPClient()
    public func fetchCoupons() async throws -> [Coupon] { ... }
}

// ViewModels
@MainActor
public class CouponViewModel: ObservableObject {
    @Published public var coupons: [Coupon] = []
    public init() {}
}

// Views
public struct CouponCardView: View {
    public init(coupon: Coupon) { ... }
    public var body: some View { ... }
}
```

## Workspace Benefits

1. **Type Safety:** Compiler enforces API contracts between packages
2. **Fast Incremental Builds:** Only changed packages rebuild
3. **Modular Testing:** Test packages independently
4. **Clear Boundaries:** Package manifests define explicit dependencies
5. **Reusability:** Easy to add new platforms (watchOS, tvOS, visionOS)
