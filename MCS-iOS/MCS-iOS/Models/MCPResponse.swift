import Foundation

struct MCPResponse<T: Codable>: Codable {
    let content: [MCPContent<T>]
}

struct MCPContent<T: Codable>: Codable {
    let type: String
    let text: String?
    let data: T?
}

// MCP tool responses
struct CouponListResponse: Codable {
    let coupons: [Coupon]
    let total: Int
    let page: Int
}

struct CampaignListResponse: Codable {
    let campaigns: [Campaign]
    let date: String
}

struct AutoClaimResponse: Codable {
    let success: Bool
    let claimed: Int
    let message: String
}

struct TimeInfo: Codable {
    let timestamp: Int64
    let formatted: String
    let year: Int
    let month: Int
    let day: Int
}
