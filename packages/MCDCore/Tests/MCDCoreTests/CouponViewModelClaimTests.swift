import XCTest
@testable import MCDCore

@MainActor
final class CouponViewModelClaimTests: XCTestCase {
    func testClaimCouponFallsBackToAutoClaimAllAndRefreshesCouponLists() async {
        let mockClient = MockCouponClient()
        mockClient.autoClaimResponse = AutoClaimResponse(success: true, claimed: 2, message: "Claimed all")
        mockClient.myCouponsResponse = CouponListResponse(
            coupons: [
                Coupon(id: "claimed-1", name: "Claimed Coupon", imageUrl: nil, expiryDate: "2026-12-31", status: "claimed")
            ],
            total: 1,
            page: 1
        )
        mockClient.availableCouponsResponse = CouponListResponse(coupons: [], total: 0, page: 1)

        let viewModel = CouponViewModel(client: mockClient)
        let selectedCoupon = Coupon(
            id: "available-1",
            name: "Selected Coupon",
            imageUrl: nil,
            expiryDate: "2026-12-31",
            status: "available"
        )

        let result = await viewModel.claimCoupon(selectedCoupon)

        XCTAssertTrue(result)
        XCTAssertEqual(mockClient.autoClaimCouponsCallCount, 1)
        XCTAssertEqual(mockClient.fetchMyCouponsCallCount, 1)
        XCTAssertEqual(mockClient.fetchAvailableCouponsCallCount, 1)
        XCTAssertEqual(viewModel.myCoupons, mockClient.myCouponsResponse.coupons)
        XCTAssertEqual(viewModel.availableCoupons, mockClient.availableCouponsResponse.coupons)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertFalse(viewModel.isLoading)
    }

    func testClaimCouponSurfacesBackendFailureMessage() async {
        let mockClient = MockCouponClient()
        mockClient.autoClaimResponse = AutoClaimResponse(success: false, claimed: 0, message: "Auto claim failed")

        let viewModel = CouponViewModel(client: mockClient)
        let selectedCoupon = Coupon(
            id: "available-2",
            name: "Another Coupon",
            imageUrl: nil,
            expiryDate: "2026-12-31",
            status: "available"
        )

        let result = await viewModel.claimCoupon(selectedCoupon)

        XCTAssertFalse(result)
        XCTAssertEqual(mockClient.autoClaimCouponsCallCount, 1)
        XCTAssertEqual(mockClient.fetchMyCouponsCallCount, 0)
        XCTAssertEqual(mockClient.fetchAvailableCouponsCallCount, 0)
        XCTAssertEqual(viewModel.errorMessage, "Auto claim failed")
        XCTAssertFalse(viewModel.isLoading)
    }
}

@MainActor
private final class MockCouponClient: CouponClientProtocol {
    var myCouponsResponse = CouponListResponse(coupons: [], total: 0, page: 1)
    var availableCouponsResponse = CouponListResponse(coupons: [], total: 0, page: 1)
    var autoClaimResponse = AutoClaimResponse(success: true, claimed: 0, message: "ok")

    var fetchMyCouponsCallCount = 0
    var fetchAvailableCouponsCallCount = 0
    var autoClaimCouponsCallCount = 0
    var clearCacheCallCount = 0

    func fetchMyCoupons(page: Int, pageSize: Int) async throws -> CouponListResponse {
        fetchMyCouponsCallCount += 1
        return myCouponsResponse
    }

    func fetchAvailableCoupons() async throws -> CouponListResponse {
        fetchAvailableCouponsCallCount += 1
        return availableCouponsResponse
    }

    func autoClaimCoupons() async throws -> AutoClaimResponse {
        autoClaimCouponsCallCount += 1
        return autoClaimResponse
    }

    func clearCache() async {
        clearCacheCallCount += 1
    }
}
