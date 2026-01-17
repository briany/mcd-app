import XCTest
@testable import MCDApp

final class ViewModelTests: XCTestCase {

    // MARK: - CouponViewModel Tests

    @MainActor
    func testCouponViewModelInitialState() {
        let viewModel = CouponViewModel()

        XCTAssertTrue(viewModel.myCoupons.isEmpty)
        XCTAssertTrue(viewModel.availableCoupons.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
    }

    // MARK: - CampaignViewModel Tests

    @MainActor
    func testCampaignViewModelInitialState() {
        let viewModel = CampaignViewModel()

        XCTAssertTrue(viewModel.campaigns.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertNotNil(viewModel.selectedDate)
        XCTAssertNil(viewModel.filterStatus)
    }
}
