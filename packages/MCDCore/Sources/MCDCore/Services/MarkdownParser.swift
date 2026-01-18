import Foundation

public struct MarkdownParser {
    // MARK: - Coupon Parsing

    public static func parseMyCoupons(_ markdown: String) -> [Coupon] {
        var coupons: [Coupon] = []

        // Split by ## headers (each coupon starts with ##)
        let sections = markdown.components(separatedBy: "\n##").dropFirst()

        for section in sections {
            let lines = section.split(separator: "\n", omittingEmptySubsequences: false).map(String.init)

            guard let name = lines.first?.trimmingCharacters(in: .whitespaces) else { continue }

            var imageUrl: String?
            var expiryDate = "Unknown"
            let status = "active"

            // Extract image URL
            if let imgLine = lines.first(where: { $0.contains("<img src=") }) {
                imageUrl = extractImageUrl(from: imgLine)
            }

            // Extract expiry date from 有效期 line
            if let expiryLine = lines.first(where: { $0.contains("**有效期**") }) {
                expiryDate = extractExpiryDate(from: expiryLine)
            }

            // Generate a simple ID from the name
            let id = name.replacingOccurrences(of: " ", with: "-").lowercased()

            coupons.append(Coupon(
                id: id,
                name: name,
                imageUrl: imageUrl,
                expiryDate: expiryDate,
                status: status
            ))
        }

        return coupons
    }

    public static func parseAvailableCoupons(_ markdown: String) -> [Coupon] {
        var coupons: [Coupon] = []

        // Split by list items (- 优惠券标题：)
        let items = markdown.components(separatedBy: "- 优惠券标题：").dropFirst()

        for item in items {
            let lines = item.split(separator: "\\", omittingEmptySubsequences: false).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

            guard let name = lines.first?.trimmingCharacters(in: .whitespaces) else { continue }

            var imageUrl: String?
            var status = "available"

            // Check if already claimed
            if let statusLine = lines.first(where: { $0.contains("状态：") }) {
                if statusLine.contains("已领取") {
                    status = "claimed"
                }
            }

            // Extract image URL
            if let imgLine = lines.first(where: { $0.contains("<img src=") }) {
                imageUrl = extractImageUrl(from: imgLine)
            }

            let id = name.replacingOccurrences(of: " ", with: "-").lowercased()

            coupons.append(Coupon(
                id: id,
                name: name,
                imageUrl: imageUrl,
                expiryDate: "2099-12-31", // No expiry info in available coupons
                status: status
            ))
        }

        return coupons
    }

    // MARK: - Campaign Parsing

    public static func parseCampaigns(_ markdown: String, for date: String) -> [Campaign] {
        var campaigns: [Campaign] = []

        // Find all campaign entries (- **活动标题**:)
        let items = markdown.components(separatedBy: "-   **活动标题**：").dropFirst()

        for item in items {
            let lines = item.split(separator: "\\", omittingEmptySubsequences: false).map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }

            guard let title = lines.first?.trimmingCharacters(in: .whitespaces) else { continue }

            var description = ""
            var imageUrl: String?

            // Extract description from 活动内容介绍
            if let descLine = lines.first(where: { $0.contains("**活动内容介绍**：") }) {
                description = descLine.replacingOccurrences(of: "**活动内容介绍**：", with: "").trimmingCharacters(in: .whitespaces)
            }

            // Extract image URL
            if let imgLine = lines.first(where: { $0.contains("<img src=") }) {
                imageUrl = extractImageUrl(from: imgLine)
            }

            let id = title.prefix(20).replacingOccurrences(of: " ", with: "-").lowercased()

            campaigns.append(Campaign(
                id: id,
                title: title,
                description: description,
                imageUrl: imageUrl,
                startDate: date,
                endDate: date,
                isSubscribed: false
            ))
        }

        return campaigns
    }

    // MARK: - Helper Methods

    private static func extractImageUrl(from line: String) -> String? {
        // Extract URL from <img src="..." pattern
        guard let srcRange = line.range(of: #"src="([^"]+)""#, options: .regularExpression) else {
            return nil
        }

        let match = String(line[srcRange])
        let url = match.replacingOccurrences(of: #"src=""#, with: "").replacingOccurrences(of: #"""#, with: "")
        return url
    }

    private static func extractExpiryDate(from line: String) -> String {
        // Extract date from: - **有效期**: 2026-01-17 00:00-2026-01-18 23:59 ...
        // Take the end date (second date)
        let datePattern = #"\d{4}-\d{2}-\d{2}"#

        guard let regex = try? NSRegularExpression(pattern: datePattern),
              let matches = regex.matches(in: line, range: NSRange(line.startIndex..., in: line)).last,
              let range = Range(matches.range, in: line) else {
            return "Unknown"
        }

        return String(line[range])
    }
}
