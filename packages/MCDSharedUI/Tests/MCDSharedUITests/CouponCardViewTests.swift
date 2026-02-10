import XCTest
import SwiftUI
@testable import MCDSharedUI
@testable import MCDCore

final class CouponCardViewTests: XCTestCase {

    func testCouponCardViewInitialization() {
        let coupon = Coupon(
            id: "test-1",
            name: "Big Mac Combo",
            imageUrl: "https://example.com/image.jpg",
            expiryDate: "2026-12-31",
            status: "Active"
        )

        let view = CouponCardView(coupon: coupon)

        XCTAssertNotNil(view)
        XCTAssertEqual(view.coupon.id, "test-1")
        XCTAssertEqual(view.coupon.name, "Big Mac Combo")
    }

    func testCouponCardViewWithNilImage() {
        let coupon = Coupon(
            id: "test-2",
            name: "McFlurry",
            imageUrl: nil,
            expiryDate: "2026-06-30",
            status: "Available"
        )

        let view = CouponCardView(coupon: coupon)

        XCTAssertNotNil(view)
        XCTAssertNil(view.coupon.imageUrl)
    }

    func testExpiryWarningLevels() {
        let referenceDate = Calendar(identifier: .gregorian).date(
            from: DateComponents(year: 2026, month: 1, day: 19, hour: 12)
        )!

        // Test critical expiry (< 3 days)
        let criticalCoupon = Coupon(
            id: "critical",
            name: "Expiring Soon",
            imageUrl: nil,
            expiryDate: "2026-01-20", // 1 day from now (assuming today is 2026-01-19)
            status: "Active"
        )

        XCTAssertEqual(criticalCoupon.daysUntilExpiry(referenceDate: referenceDate), 1)

        // Test far future expiry
        let safeCoupon = Coupon(
            id: "safe",
            name: "Safe Coupon",
            imageUrl: nil,
            expiryDate: "2026-12-31",
            status: "Active"
        )

        XCTAssertTrue((safeCoupon.daysUntilExpiry(referenceDate: referenceDate) ?? 0) > 3)
    }
}
