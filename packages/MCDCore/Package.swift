// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MCDCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MCDCore", targets: ["MCDCore"])
    ],
    dependencies: [
        .package(url: "https://github.com/google/GoogleSignIn-iOS", from: "8.0.0")
    ],
    targets: [
        .target(
            name: "MCDCore",
            dependencies: [
                .product(name: "GoogleSignIn", package: "GoogleSignIn-iOS")
            ],
            path: "Sources/MCDCore"
        ),
        .testTarget(name: "MCDCoreTests", dependencies: ["MCDCore"], path: "Tests/MCDCoreTests")
    ]
)
