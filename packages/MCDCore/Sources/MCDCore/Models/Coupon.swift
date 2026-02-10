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

    private static let dateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.timeZone = TimeZone(secondsFromGMT: 0)
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter
    }()

    private static let utcCalendar: Calendar = {
        var calendar = Calendar(identifier: .gregorian)
        calendar.timeZone = TimeZone(secondsFromGMT: 0) ?? .current
        return calendar
    }()

    public var expiryDateParsed: Date? {
        Coupon.dateFormatter.date(from: expiryDate)
    }

    public var daysUntilExpiry: Int? {
        daysUntilExpiry(referenceDate: Date())
    }

    public func daysUntilExpiry(referenceDate: Date) -> Int? {
        guard let expiry = expiryDateParsed else { return nil }
        let startOfReferenceDay = Coupon.utcCalendar.startOfDay(for: referenceDate)
        let startOfExpiryDay = Coupon.utcCalendar.startOfDay(for: expiry)
        return Coupon.utcCalendar.dateComponents([.day], from: startOfReferenceDay, to: startOfExpiryDay).day
    }

    public var expiryWarningLevel: ExpiryWarning {
        expiryWarningLevel(referenceDate: Date())
    }

    public func expiryWarningLevel(referenceDate: Date) -> ExpiryWarning {
        guard let days = daysUntilExpiry(referenceDate: referenceDate) else { return .none }
        if days < 0 { return .expired }
        if days < 3 { return .critical }
        if days < 7 { return .warning }
        return .none
    }

    public enum ExpiryWarning {
        case none, warning, critical, expired
    }
}
