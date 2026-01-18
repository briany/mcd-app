import Foundation

public enum MCPError: LocalizedError {
    case networkError(Error)
    case invalidResponse
    case decodingError(Error)
    case authenticationError
    case rateLimitExceeded
    case serverError(String)

    public var errorDescription: String? {
        switch self {
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .invalidResponse:
            return "Invalid response from server"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .authenticationError:
            return "Authentication failed. Please check your token."
        case .rateLimitExceeded:
            return "Rate limit exceeded. Please try again later."
        case .serverError(let message):
            return "Server error: \(message)"
        }
    }
}
