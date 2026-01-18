import Foundation

public struct Campaign: Identifiable, Codable, Hashable {
    public let id: String
    public let title: String
    public let description: String
    public let imageUrl: String?
    public let startDate: String
    public let endDate: String
    public let isSubscribed: Bool

    public init(id: String, title: String, description: String, imageUrl: String?, startDate: String, endDate: String, isSubscribed: Bool) {
        self.id = id
        self.title = title
        self.description = description
        self.imageUrl = imageUrl
        self.startDate = startDate
        self.endDate = endDate
        self.isSubscribed = isSubscribed
    }

    public var startDateParsed: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: startDate)
    }

    public var endDateParsed: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: endDate)
    }

    public var status: CampaignStatus {
        let now = Date()
        guard let start = startDateParsed, let end = endDateParsed else {
            return .unknown
        }
        if now < start { return .upcoming }
        if now > end { return .past }
        return .ongoing
    }

    public enum CampaignStatus {
        case ongoing, past, upcoming, unknown
    }
}
