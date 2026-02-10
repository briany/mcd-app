import Foundation

// MCP API Response Wrappers
private struct MCPAPIResponse: Decodable {
    let jsonrpc: String
    let id: Int
    let result: MCPResult?
    let error: MCPAPIError?
}

private struct MCPResult: Decodable {
    let content: [MCPContentItem]?
    let isError: Bool?
    let structuredContent: MCPStructuredContent?
}

private struct MCPContentItem: Decodable {
    let text: String?
    let type: String?
}

private struct MCPStructuredContent: Decodable {
    let success: Bool
    let code: Int
    let message: String
    let data: [String: Any]?

    enum CodingKeys: String, CodingKey {
        case success, code, message, data
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        success = try container.decode(Bool.self, forKey: .success)
        code = try container.decode(Int.self, forKey: .code)
        message = try container.decode(String.self, forKey: .message)
        data = try? container.decode([String: Any].self, forKey: .data)
    }
}

private struct MCPAPIError: Decodable {
    let code: Int
    let message: String
}

extension KeyedDecodingContainer {
    func decode(_ type: Dictionary<String, Any>.Type, forKey key: K) throws -> [String: Any] {
        let container = try self.nestedContainer(keyedBy: JSONCodingKeys.self, forKey: key)
        return try container.decode(type)
    }

    func decode(_ type: Array<Any>.Type, forKey key: K) throws -> [Any] {
        var container = try self.nestedUnkeyedContainer(forKey: key)
        return try container.decode(type)
    }

    func decode(_ type: Dictionary<String, Any>.Type) throws -> [String: Any] {
        var dictionary = [String: Any]()

        for key in allKeys {
            if let boolValue = try? decode(Bool.self, forKey: key) {
                dictionary[key.stringValue] = boolValue
            } else if let stringValue = try? decode(String.self, forKey: key) {
                dictionary[key.stringValue] = stringValue
            } else if let intValue = try? decode(Int.self, forKey: key) {
                dictionary[key.stringValue] = intValue
            } else if let doubleValue = try? decode(Double.self, forKey: key) {
                dictionary[key.stringValue] = doubleValue
            } else if let nestedDictionary = try? decode(Dictionary<String, Any>.self, forKey: key) {
                dictionary[key.stringValue] = nestedDictionary
            } else if let nestedArray = try? decode(Array<Any>.self, forKey: key) {
                dictionary[key.stringValue] = nestedArray
            }
        }
        return dictionary
    }
}

extension UnkeyedDecodingContainer {
    mutating func decode(_ type: Array<Any>.Type) throws -> [Any] {
        var array: [Any] = []
        while isAtEnd == false {
            if let value = try? decode(Bool.self) {
                array.append(value)
            } else if let value = try? decode(String.self) {
                array.append(value)
            } else if let value = try? decode(Int.self) {
                array.append(value)
            } else if let value = try? decode(Double.self) {
                array.append(value)
            } else if let nestedDictionary = try? decode(Dictionary<String, Any>.self) {
                array.append(nestedDictionary)
            } else if let nestedArray = try? decode(Array<Any>.self) {
                array.append(nestedArray)
            }
        }
        return array
    }

    mutating func decode(_ type: Dictionary<String, Any>.Type) throws -> [String: Any] {
        let nestedContainer = try self.nestedContainer(keyedBy: JSONCodingKeys.self)
        return try nestedContainer.decode(type)
    }
}

private struct JSONCodingKeys: CodingKey {
    var stringValue: String
    var intValue: Int?

    init?(stringValue: String) {
        self.stringValue = stringValue
    }

    init?(intValue: Int) {
        self.init(stringValue: "\(intValue)")
        self.intValue = intValue
    }
}

public actor MCPClient {
    public static let shared = MCPClient()

    private let baseURL = MCDConfiguration.mcpBaseURL

    private var cache: [String: (data: Data, timestamp: Date)] = [:]
    private let cacheExpiration: TimeInterval = 300 // 5 minutes

    private init() {}

    private func makeCacheKey(tool: String, arguments: [String: Any]) -> String {
        guard !arguments.isEmpty else { return tool }

        if let encoded = try? JSONSerialization.data(withJSONObject: arguments, options: [.sortedKeys]),
           let json = String(data: encoded, encoding: .utf8) {
            return "\(tool)-\(json)"
        }

        // Fallback to a deterministic ordering if JSON serialization fails.
        let normalized = arguments
            .map { key, value in "\(key)=\(String(describing: value))" }
            .sorted()
            .joined(separator: "&")
        return "\(tool)-\(normalized)"
    }

    /// Get the MCP token, throwing an error if not configured
    private func getToken() throws -> String {
        guard let token = MCDConfiguration.mcpToken else {
            throw MCPError.configurationError("MCP Token not configured. Please add MCD_MCP_TOKEN to Config.plist or set it as an environment variable.")
        }
        return token
    }

    // MARK: - Core Request Methods

    private func makeMarkdownRequest(
        tool: String,
        arguments: [String: Any] = [:]
    ) async throws -> String {
        let cacheKey = makeCacheKey(tool: tool, arguments: arguments)

        // Check cache
        if let cached = cache[cacheKey],
           Date().timeIntervalSince(cached.timestamp) < cacheExpiration,
           let markdown = String(data: cached.data, encoding: .utf8) {
            return markdown
        }

        // Get token (throws if not configured)
        let token = try getToken()

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

        // Decode MCP API response and surface structured MCP error payloads.
        let decoder = JSONDecoder()
        let mcpResponse: MCPAPIResponse
        do {
            mcpResponse = try decoder.decode(MCPAPIResponse.self, from: data)
        } catch {
            throw MCPError.decodingError(error)
        }

        if let error = mcpResponse.error {
            throw MCPError.serverError("MCP Error \(error.code): \(error.message)")
        }

        guard let result = mcpResponse.result else {
            throw MCPError.invalidResponse
        }

        if result.isError == true {
            let message = result.content?.first(where: { $0.text?.isEmpty == false })?.text
            throw MCPError.serverError(message ?? "MCP tool returned an error response")
        }

        guard let text = result.content?.first(where: { $0.text?.isEmpty == false })?.text else {
            throw MCPError.invalidResponse
        }

        // Cache successful response
        if let markdownData = text.data(using: .utf8) {
            cache[cacheKey] = (data: markdownData, timestamp: Date())
        }

        return text
    }

    private func makeStructuredRequest<T: Decodable>(
        tool: String,
        arguments: [String: Any] = [:]
    ) async throws -> T {
        let cacheKey = makeCacheKey(tool: tool, arguments: arguments)

        // Check cache
        if let cached = cache[cacheKey],
           Date().timeIntervalSince(cached.timestamp) < cacheExpiration {
            let decoder = JSONDecoder()
            return try decoder.decode(T.self, from: cached.data)
        }

        // Get token (throws if not configured)
        let token = try getToken()

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

        // Decode MCP API response
        let decoder = JSONDecoder()
        let mcpResponse: MCPAPIResponse
        do {
            mcpResponse = try decoder.decode(MCPAPIResponse.self, from: data)
        } catch {
            throw MCPError.decodingError(error)
        }

        // Check for API errors
        if let error = mcpResponse.error {
            throw MCPError.serverError("MCP Error \(error.code): \(error.message)")
        }

        guard let result = mcpResponse.result,
              let structuredContent = result.structuredContent,
              structuredContent.success else {
            throw MCPError.invalidResponse
        }

        // Extract data from structuredContent
        guard let dataDict = structuredContent.data else {
            throw MCPError.invalidResponse
        }

        // Convert dictionary back to JSON data and decode as expected type
        let jsonData = try JSONSerialization.data(withJSONObject: dataDict)

        // Cache successful response
        cache[cacheKey] = (data: jsonData, timestamp: Date())

        do {
            return try decoder.decode(T.self, from: jsonData)
        } catch {
            throw MCPError.decodingError(error)
        }
    }

    // MARK: - Public API Methods

    public func fetchMyCoupons(page: Int = 1, pageSize: Int = 200) async throws -> CouponListResponse {
        let markdown = try await makeMarkdownRequest(
            tool: "my-coupons",
            arguments: [
                "page": String(page),
                "pageSize": String(pageSize)
            ]
        )

        let coupons = MarkdownParser.parseMyCoupons(markdown)
        return CouponListResponse(
            coupons: coupons,
            total: coupons.count,
            page: page
        )
    }

    public func fetchAvailableCoupons() async throws -> CouponListResponse {
        let markdown = try await makeMarkdownRequest(
            tool: "available-coupons",
            arguments: [:]
        )

        let coupons = MarkdownParser.parseAvailableCoupons(markdown)
        return CouponListResponse(
            coupons: coupons,
            total: coupons.count,
            page: 1
        )
    }

    public func autoClaimCoupons() async throws -> AutoClaimResponse {
        let markdown = try await makeMarkdownRequest(
            tool: "auto-bind-coupons",
            arguments: [:]
        )

        // Parse success message from markdown
        let success = !markdown.contains("失败") && !markdown.contains("错误")
        let claimed = 0  // Cannot reliably parse count from markdown

        return AutoClaimResponse(
            success: success,
            claimed: claimed,
            message: markdown
        )
    }

    public func fetchCampaigns(date: String? = nil) async throws -> CampaignListResponse {
        var args: [String: Any] = [:]
        if let date = date {
            args["specifiedDate"] = date
        }

        let markdown = try await makeMarkdownRequest(
            tool: "campaign-calender",
            arguments: args
        )

        let dateStr = date ?? ""
        let campaigns = MarkdownParser.parseCampaigns(markdown, for: dateStr)

        return CampaignListResponse(
            campaigns: campaigns,
            date: dateStr
        )
    }

    public func getCurrentTime() async throws -> TimeInfo {
        try await makeStructuredRequest(
            tool: "now-time-info",
            arguments: [:]
        )
    }

    public func clearCache() {
        cache.removeAll()
    }
}
