import Foundation

public struct Coupon: Identifiable, Codable, Hashable {
    public let id: String
    public let name: String
    public let imageUrl: String?
    public let expiryDate: String
    public let status: String
    public let rawMarkdown: String?

    public init(id: String, name: String, imageUrl: String?, expiryDate: String, status: String, rawMarkdown: String? = nil) {
        self.id = id
        self.name = name
        self.imageUrl = imageUrl
        self.expiryDate = expiryDate
        self.status = status
        self.rawMarkdown = rawMarkdown
    }

    public var expiryDateParsed: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: expiryDate)
    }

    public var daysUntilExpiry: Int? {
        guard let expiry = expiryDateParsed else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expiry).day
    }

    public var expiryWarningLevel: ExpiryWarning {
        guard let days = daysUntilExpiry else { return .none }
        if days < 0 { return .expired }
        if days < 3 { return .critical }
        if days < 7 { return .warning }
        return .none
    }

    public enum ExpiryWarning {
        case none, warning, critical, expired
    }
}
