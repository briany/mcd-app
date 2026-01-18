import Foundation

public struct MCPResponse<T: Codable>: Codable {
    public let content: [MCPContent<T>]
}

public struct MCPContent<T: Codable>: Codable {
    public let type: String
    public let text: String?
    public let data: T?
}

// MCP tool responses
public struct CouponListResponse: Codable {
    public let coupons: [Coupon]
    public let total: Int
    public let page: Int
}

public struct CampaignListResponse: Codable {
    public let campaigns: [Campaign]
    public let date: String
}

public struct AutoClaimResponse: Codable {
    public let success: Bool
    public let claimed: Int
    public let message: String
}

public struct TimeInfo: Codable {
    public let timestamp: Int64
    public let formatted: String
    public let year: Int
    public let month: Int
    public let day: Int
}
