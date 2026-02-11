import XCTest
@testable import MCDCore

final class IntegrationTests: XCTestCase {
    func testMCPClientCanMakeRequests() async throws {
        let config = URLSessionConfiguration.ephemeral
        config.protocolClasses = [MockURLProtocol.self]
        let session = URLSession(configuration: config)

        MockURLProtocol.requestHandler = { request in
            XCTAssertEqual(request.httpMethod, "POST")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Authorization"), "Bearer test-token")
            XCTAssertEqual(request.value(forHTTPHeaderField: "Content-Type"), "application/json")

            let body = try requestBodyData(from: request)
            let payload = try XCTUnwrap(
                try JSONSerialization.jsonObject(with: body) as? [String: Any]
            )
            XCTAssertEqual(payload["method"] as? String, "tools/call")

            let params = try XCTUnwrap(payload["params"] as? [String: Any])
            XCTAssertEqual(params["name"] as? String, "now-time-info")

            let responseJSON: [String: Any] = [
                "jsonrpc": "2.0",
                "id": 1,
                "result": [
                    "structuredContent": [
                        "success": true,
                        "code": 0,
                        "message": "ok",
                        "data": [
                            "timestamp": 1_736_249_600,
                            "formatted": "2025-01-19 00:00:00",
                            "year": 2025,
                            "month": 1,
                            "day": 19
                        ]
                    ]
                ]
            ]

            let data = try JSONSerialization.data(withJSONObject: responseJSON)
            let response = HTTPURLResponse(
                url: try XCTUnwrap(request.url),
                statusCode: 200,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )!
            return (response, data)
        }

        defer { MockURLProtocol.requestHandler = nil }

        let client = MCPClient(
            baseURL: "https://example.com/mcp",
            tokenProvider: { "test-token" },
            session: session
        )

        let timeInfo = try await client.getCurrentTime()
        XCTAssertEqual(timeInfo.timestamp, 1_736_249_600)
        XCTAssertEqual(timeInfo.formatted, "2025-01-19 00:00:00")
        XCTAssertEqual(timeInfo.year, 2025)
        XCTAssertEqual(timeInfo.month, 1)
        XCTAssertEqual(timeInfo.day, 19)
    }
}

private final class MockURLProtocol: URLProtocol {
    static var requestHandler: ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool {
        true
    }

    override class func canonicalRequest(for request: URLRequest) -> URLRequest {
        request
    }

    override func startLoading() {
        guard let handler = Self.requestHandler else {
            fatalError("MockURLProtocol.requestHandler was not set")
        }

        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}

private func requestBodyData(from request: URLRequest) throws -> Data {
    if let body = request.httpBody {
        return body
    }

    guard let stream = request.httpBodyStream else {
        XCTFail("Expected request body data")
        return Data()
    }

    stream.open()
    defer { stream.close() }

    var data = Data()
    let bufferSize = 1024
    var buffer = [UInt8](repeating: 0, count: bufferSize)

    while stream.hasBytesAvailable {
        let read = stream.read(&buffer, maxLength: bufferSize)
        if read < 0 {
            throw stream.streamError ?? NSError(domain: "MockURLProtocol", code: -1)
        }
        if read == 0 {
            break
        }
        data.append(buffer, count: read)
    }

    return data
}
