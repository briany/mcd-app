// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "MCDApp",
    platforms: [.macOS(.v14)],
    products: [
        .executable(name: "MCDApp", targets: ["MCDApp"])
    ],
    targets: [
        .executableTarget(
            name: "MCDApp",
            path: "MCDApp"
        ),
        .testTarget(
            name: "MCDAppTests",
            dependencies: ["MCDApp"],
            path: "MCDAppTests"
        )
    ]
)
