import Foundation

enum Config {
    /// MCP Server Configuration
    static let mcpBaseURL = "https://mcp.mcd.cn/mcp-servers/mcd-mcp"

    /// Bearer Token - Read from environment variable or Info.plist
    static var mcpToken: String {
        // First try environment variable
        if let token = ProcessInfo.processInfo.environment["MCD_MCP_TOKEN"], !token.isEmpty {
            return token
        }

        // Then try reading from a local config file (not committed to git)
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let configDict = NSDictionary(contentsOfFile: configPath),
           let token = configDict["MCD_MCP_TOKEN"] as? String, !token.isEmpty {
            return token
        }

        // Fallback error - this should never be reached in production
        fatalError("""
            MCP Token not configured!

            Please set the token in one of these ways:
            1. Environment variable: export MCD_MCP_TOKEN=your_token_here
            2. Create Config.plist with key MCD_MCP_TOKEN
            """)
    }
}
