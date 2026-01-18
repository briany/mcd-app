import XCTest
@testable import MCDCore

final class ViewModelTests: XCTestCase {

    // MARK: - CouponViewModel Tests

    @MainActor
    func testCouponViewModelInitialState() throws {
        try XCTSkipIf(true, "Skip ViewModel tests that require MCP token configuration")
        let viewModel = CouponViewModel()

        XCTAssertTrue(viewModel.myCoupons.isEmpty)
        XCTAssertTrue(viewModel.availableCoupons.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
    }

    // MARK: - CampaignViewModel Tests

    @MainActor
    func testCampaignViewModelInitialState() throws {
        try XCTSkipIf(true, "Skip ViewModel tests that require MCP token configuration")
        let viewModel = CampaignViewModel()

        XCTAssertTrue(viewModel.campaigns.isEmpty)
        XCTAssertFalse(viewModel.isLoading)
        XCTAssertNil(viewModel.errorMessage)
        XCTAssertNotNil(viewModel.selectedDate)
        XCTAssertNil(viewModel.filterStatus)
    }
}
