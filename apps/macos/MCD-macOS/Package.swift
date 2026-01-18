// swift-tools-version: 5.9
import PackageDescription

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
            path: "MCDApp"
        )
    ]
)
