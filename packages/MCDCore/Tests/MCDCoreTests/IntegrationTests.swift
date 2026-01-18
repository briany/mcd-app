import XCTest
@testable import MCDCore

final class IntegrationTests: XCTestCase {
    func testMCPClientCanMakeRequests() async throws {
        try XCTSkipIf(true, "Skip live API tests by default")

        let timeInfo = try await MCPClient.shared.getCurrentTime()
        XCTAssertGreaterThan(timeInfo.timestamp, 0)
    }
}
