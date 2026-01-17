import Foundation

struct Campaign: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let description: String
    let startDate: String
    let endDate: String
    let isSubscribed: Bool

    var startDateParsed: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: startDate)
    }

    var endDateParsed: Date? {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"
        return formatter.date(from: endDate)
    }

    var status: CampaignStatus {
        let now = Date()
        guard let start = startDateParsed, let end = endDateParsed else {
            return .unknown
        }
        if now < start { return .upcoming }
        if now > end { return .past }
        return .ongoing
    }

    enum CampaignStatus {
        case ongoing, past, upcoming, unknown
    }
}
