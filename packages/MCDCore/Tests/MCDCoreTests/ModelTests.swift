import XCTest
@testable import MCDCore

final class ModelTests: XCTestCase {
    func testCouponDecoding() throws {
        let json = """
        {
            "id": "123",
            "name": "Big Mac Combo",
            "imageUrl": "https://example.com/image.jpg",
            "expiryDate": "2026-01-20",
            "status": "available"
        }
        """.data(using: .utf8)!

        let coupon = try JSONDecoder().decode(Coupon.self, from: json)
        XCTAssertEqual(coupon.id, "123")
        XCTAssertEqual(coupon.name, "Big Mac Combo")
    }

    func testCampaignDecoding() throws {
        let json = """
        {
            "id": "456",
            "title": "Spring Festival Deal",
            "description": "Special promotion",
            "startDate": "2026-01-15",
            "endDate": "2026-01-25",
            "isSubscribed": true
        }
        """.data(using: .utf8)!

        let campaign = try JSONDecoder().decode(Campaign.self, from: json)
        XCTAssertEqual(campaign.title, "Spring Festival Deal")
        XCTAssertTrue(campaign.isSubscribed)
    }
}
