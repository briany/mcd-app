import Foundation
@testable import MCDCore

/// Mock MCP Client for testing without requiring actual API calls or token
@MainActor
class MockMCPClient {
    var shouldFail = false
    var mockCoupons: [Coupon] = []
    var mockCampaigns: [Campaign] = []
    var mockTimeInfo: TimeInfo?

    func fetchMyCoupons() async throws -> [Coupon] {
        if shouldFail {
            throw MCPError.networkError(NSError(domain: "Mock", code: -1, userInfo: nil))
        }
        return mockCoupons
    }

    func fetchAvailableCoupons() async throws -> [Coupon] {
        if shouldFail {
            throw MCPError.networkError(NSError(domain: "Mock", code: -1, userInfo: nil))
        }
        return mockCoupons
    }

    func fetchCampaigns(for date: String?) async throws -> [Campaign] {
        if shouldFail {
            throw MCPError.networkError(NSError(domain: "Mock", code: -1, userInfo: nil))
        }
        return mockCampaigns
    }

    func getCurrentTime() async throws -> TimeInfo {
        if shouldFail {
            throw MCPError.networkError(NSError(domain: "Mock", code: -1, userInfo: nil))
        }
        return mockTimeInfo ?? TimeInfo(
            timestamp: 1234567890,
            formatted: "2026-01-19 08:00:00",
            year: 2026,
            month: 1,
            day: 19
        )
    }

    func claimCoupon(couponId: String) async throws -> Bool {
        if shouldFail {
            throw MCPError.networkError(NSError(domain: "Mock", code: -1, userInfo: nil))
        }
        return true
    }

    func autoClaimCoupons() async throws -> Int {
        if shouldFail {
            throw MCPError.networkError(NSError(domain: "Mock", code: -1, userInfo: nil))
        }
        return mockCoupons.count
    }
}
