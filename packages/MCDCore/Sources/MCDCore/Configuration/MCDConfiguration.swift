import Foundation

public enum MCDConfiguration {
    /// MCP Server Configuration
    public static let mcpBaseURL = "https://mcp.mcd.cn/mcp-servers/mcd-mcp"

    /// Web App URL for OAuth flow
    public static let webAppURL = "http://localhost:3000"

    /// Bearer Token - Read from environment variable or Config.plist
    public static var mcpToken: String {
        // First try environment variable
        if let token = ProcessInfo.processInfo.environment["MCD_MCP_TOKEN"], !token.isEmpty {
            return token
        }

        // Try to find Config.plist from various sources
        if let token = findTokenFromConfig() {
            return token
        }

        // Fallback error - this should never be reached in production
        fatalError("""
            MCP Token not configured!

            Please set the token in one of these ways:
            1. Environment variable: export MCD_MCP_TOKEN=your_token_here
            2. Run ./scripts/setup-config.sh and add your token to Config.plist
            """)
    }

    private static func findTokenFromConfig() -> String? {
        // 1. Try Bundle.main (works for .app bundles)
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let token = readToken(from: configPath) {
            return token
        }

        // 2. Try all loaded bundles
        for bundle in Bundle.allBundles {
            if let configPath = bundle.path(forResource: "Config", ofType: "plist"),
               let token = readToken(from: configPath) {
                return token
            }
        }

        // 3. Try SPM resource bundle next to executable (for SPM executables)
        let executableURL = URL(fileURLWithPath: CommandLine.arguments[0])
        let executableDir = executableURL.deletingLastPathComponent()

        // SPM names resource bundles as "{PackageName}_{TargetName}.bundle"
        let bundlePatterns = [
            "MCD-macOS_MCDApp.bundle",
            "MCD-iOS_MCDApp.bundle",
            "MCDApp.bundle"
        ]

        for pattern in bundlePatterns {
            let bundlePath = executableDir.appendingPathComponent(pattern)
            if let bundle = Bundle(url: bundlePath),
               let configPath = bundle.path(forResource: "Config", ofType: "plist"),
               let token = readToken(from: configPath) {
                return token
            }
        }

        return nil
    }

    private static func readToken(from path: String) -> String? {
        guard let configDict = NSDictionary(contentsOfFile: path),
              let token = configDict["MCD_MCP_TOKEN"] as? String,
              !token.isEmpty,
              token != "YOUR_TOKEN_HERE" else {
            return nil
        }
        return token
    }
}
