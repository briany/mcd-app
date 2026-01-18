import Foundation

struct Coupon: Identifiable, Codable, Hashable {
    let id: String
    let name: String
    let imageUrl: String?
    let expiryDate: String
    let status: String

    var expiryDateParsed: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: expiryDate)
    }

    var daysUntilExpiry: Int? {
        guard let expiry = expiryDateParsed else { return nil }
        return Calendar.current.dateComponents([.day], from: Date(), to: expiry).day
    }

    var expiryWarningLevel: ExpiryWarning {
        guard let days = daysUntilExpiry else { return .none }
        if days < 0 { return .expired }
        if days < 3 { return .critical }
        if days < 7 { return .warning }
        return .none
    }

    enum ExpiryWarning {
        case none, warning, critical, expired
    }
}
