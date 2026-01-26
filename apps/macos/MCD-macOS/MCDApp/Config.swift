import Foundation
import MCDCore

// Thin wrapper for backward compatibility
// All configuration logic now lives in MCDCore.MCDConfiguration
enum Config {
    static let mcpBaseURL = MCDConfiguration.mcpBaseURL
    static var mcpToken: String? { MCDConfiguration.mcpToken }
}
