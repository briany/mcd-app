// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MCDCore",
    platforms: [.iOS(.v17), .macOS(.v14)],
    products: [
        .library(name: "MCDCore", targets: ["MCDCore"])
    ],
    targets: [
        .target(name: "MCDCore", path: "Sources/MCDCore"),
        .testTarget(name: "MCDCoreTests", dependencies: ["MCDCore"], path: "Tests/MCDCoreTests")
    ]
)
