// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Lingua",
    platforms: [.macOS(.v14)],
    products: [.executable(name: "Lingua", targets: ["LinguaApp"]), .executable(name: "lingua-validate", targets: ["LinguaValidator"])],
    targets: [
        .executableTarget(name: "LinguaApp", dependencies: ["LinguaCore"], resources: [.process("Resources")]),
        .executableTarget(name: "LinguaValidator", dependencies: ["LinguaCore"]),
        .target(name: "LinguaCore", path: "Sources/LinguaCore")
    ]
)
