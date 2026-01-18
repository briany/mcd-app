import XCTest
@testable import MCDCore

final class MCPClientTests: XCTestCase {
    func testMCPErrorDescription() {
        let networkError = MCPError.networkError(NSError(domain: "test", code: -1))
        XCTAssertNotNil(networkError.localizedDescription)

        let invalidResponse = MCPError.invalidResponse
        XCTAssertEqual(invalidResponse.localizedDescription, "Invalid response from server")
    }
}
