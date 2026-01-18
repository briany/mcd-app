// swift-tools-version: 5.9
import PackageDescription

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
        .target(name: "MCDSharedUI", dependencies: ["MCDCore"], path: "Sources/MCDSharedUI"),
        .testTarget(name: "MCDSharedUITests", dependencies: ["MCDSharedUI"], path: "Tests/MCDSharedUITests")
    ]
)
