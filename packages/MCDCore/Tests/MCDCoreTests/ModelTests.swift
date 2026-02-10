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

    func testCouponDaysUntilExpirySupportsReferenceDate() {
        let coupon = Coupon(
            id: "123",
            name: "Big Mac Combo",
            imageUrl: nil,
            expiryDate: "2026-02-20",
            status: "available"
        )

        let referenceDate = Calendar(identifier: .gregorian).date(
            from: DateComponents(year: 2026, month: 2, day: 19, hour: 12)
        )!

        XCTAssertEqual(coupon.daysUntilExpiry(referenceDate: referenceDate), 1)
    }

    func testCampaignStatusTreatsEndDateAsInclusive() {
        let campaign = Campaign(
            id: "campaign-1",
            title: "Spring Festival Deal",
            description: "Special promotion",
            imageUrl: nil,
            startDate: "2026-02-01",
            endDate: "2026-02-10",
            isSubscribed: false
        )

        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .current
        let endDateNoon = calendar.date(
            from: DateComponents(year: 2026, month: 2, day: 10, hour: 12)
        )!
        let nextDay = calendar.date(
            from: DateComponents(year: 2026, month: 2, day: 11, hour: 0)
        )!

        switch campaign.status(referenceDate: endDateNoon) {
        case .ongoing:
            break
        default:
            XCTFail("Campaign should still be ongoing for its end date")
        }

        switch campaign.status(referenceDate: nextDay) {
        case .past:
            break
        default:
            XCTFail("Campaign should be past after end date")
        }
    }
}
