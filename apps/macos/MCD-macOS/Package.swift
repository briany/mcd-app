// swift-tools-version: 5.9
import PackageDescription
import Foundation

// Check if Config.plist exists (created by scripts/setup-config.sh)
let configPlistPath = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent()
    .appendingPathComponent("MCDApp/Config.plist")
    .path
let hasConfigPlist = FileManager.default.fileExists(atPath: configPlistPath)

// Only include Config.plist as a resource if it exists locally
let resources: [Resource]? = hasConfigPlist ? [.copy("Config.plist")] : nil

let package = Package(
    name: "MCD-macOS",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "MCD-macOS", targets: ["MCDApp"])
    ],
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
            ],
            path: "MCDApp",
            resources: resources
        )
    ]
)
