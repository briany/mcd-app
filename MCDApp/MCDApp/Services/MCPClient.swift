import Foundation

actor MCPClient {
    static let shared = MCPClient()

    private let baseURL = "https://mcp.mcd.cn/mcp-servers/mcd-mcp"
    private let token = "1t8EuirFCyleKY9dCeBAMOXUsMnzYcj2"

    private var cache: [String: (data: Data, timestamp: Date)] = [:]
    private let cacheExpiration: TimeInterval = 300 // 5 minutes

    private init() {}

    // MARK: - Core Request Method

    private func makeRequest<T: Codable>(
        tool: String,
        arguments: [String: Any] = [:]
    ) async throws -> T {
        let cacheKey = "\(tool)-\(arguments.description)"

        // Check cache
        if let cached = cache[cacheKey],
           Date().timeIntervalSince(cached.timestamp) < cacheExpiration {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: cached.data)
        }

        // Build request
        var request = URLRequest(url: URL(string: baseURL)!)
        request.httpMethod = "POST"
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let body: [String: Any] = [
            "method": "tools/call",
            "params": [
                "name": tool,
                "arguments": arguments
            ]
        ]

        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        // Execute request
        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse else {
            throw MCPError.invalidResponse
        }

        switch httpResponse.statusCode {
        case 200...299:
            break
        case 401, 403:
            throw MCPError.authenticationError
        case 429:
            throw MCPError.rateLimitExceeded
        default:
            throw MCPError.serverError("HTTP \(httpResponse.statusCode)")
        }

        // Cache successful response
        cache[cacheKey] = (data: data, timestamp: Date())

        // Decode
        let decoder = JSONDecoder()
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw MCPError.decodingError(error)
        }
    }

    // MARK: - Public API Methods

    func fetchMyCoupons(page: Int = 1, pageSize: Int = 200) async throws -> CouponListResponse {
        try await makeRequest(
            tool: "mcp__mcd-mcp__my-coupons",
            arguments: [
                "page": String(page),
                "pageSize": String(pageSize)
            ]
        )
    }

    func fetchAvailableCoupons() async throws -> CouponListResponse {
        try await makeRequest(
            tool: "mcp__mcd-mcp__available-coupons",
            arguments: [:]
        )
    }

    func autoClaimCoupons() async throws -> AutoClaimResponse {
        try await makeRequest(
            tool: "mcp__mcd-mcp__auto-bind-coupons",
            arguments: [:]
        )
    }

    func fetchCampaigns(date: String? = nil) async throws -> CampaignListResponse {
        var args: [String: Any] = [:]
        if let date = date {
            args["specifiedDate"] = date
        }
        return try await makeRequest(
            tool: "mcp__mcd-mcp__campaign-calender",
            arguments: args
        )
    }

    func getCurrentTime() async throws -> TimeInfo {
        try await makeRequest(
            tool: "mcp__mcd-mcp__now-time-info",
            arguments: [:]
        )
    }

    func clearCache() {
        cache.removeAll()
    }
}
