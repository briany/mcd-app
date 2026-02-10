import Foundation

public struct Campaign: Identifiable, Codable, Hashable {
    public let id: String
    public let title: String
    public let description: String
    public let imageUrl: String?
    public let startDate: String
    public let endDate: String
    public let isSubscribed: Bool
    public let rawMarkdown: String?

    public init(id: String, title: String, description: String, imageUrl: String?, startDate: String, endDate: String, isSubscribed: Bool, rawMarkdown: String? = nil) {
        self.id = id
        self.title = title
        self.description = description
        self.imageUrl = imageUrl
        self.startDate = startDate
        self.endDate = endDate
        self.isSubscribed = isSubscribed
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

    public var startDateParsed: Date? {
        Campaign.dateFormatter.date(from: startDate)
    }

    public var endDateParsed: Date? {
        Campaign.dateFormatter.date(from: endDate)
    }

    public var status: CampaignStatus {
        status(referenceDate: Date())
    }

    public func status(referenceDate: Date) -> CampaignStatus {
        guard let start = startDateParsed, let end = endDateParsed else {
            return .unknown
        }

        let referenceDay = Campaign.utcCalendar.startOfDay(for: referenceDate)
        let startDay = Campaign.utcCalendar.startOfDay(for: start)
        let endDay = Campaign.utcCalendar.startOfDay(for: end)

        if referenceDay < startDay { return .upcoming }
        if referenceDay > endDay { return .past }

        return .ongoing
    }

    public enum CampaignStatus {
        case ongoing, past, upcoming, unknown
    }
}
