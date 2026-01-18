import Foundation
import SwiftUI

@MainActor
public class CampaignViewModel: ObservableObject {
    @Published public var campaigns: [Campaign] = []
    @Published public var isLoading = false
    @Published public var errorMessage: String?
    @Published public var selectedDate: Date = Date()
    @Published public var filterStatus: Campaign.CampaignStatus? = nil

    private let client = MCPClient.shared

    public init() {}

    // MARK: - Computed Properties

    public var filteredCampaigns: [Campaign] {
        guard let status = filterStatus else {
            return campaigns
        }
        return campaigns.filter { $0.status == status }
    }

    // MARK: - Public Methods

    public func fetchCampaigns(for date: Date? = nil) async {
        isLoading = true
        errorMessage = nil

        let dateString: String?
        if let date = date {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            dateString = formatter.string(from: date)
        } else {
            dateString = nil
        }

        do {
            let response = try await client.fetchCampaigns(date: dateString)
            campaigns = response.campaigns
        } catch let error as MCPError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
        }

        isLoading = false
    }

    public func refresh() async {
        await client.clearCache()
        await fetchCampaigns(for: selectedDate)
    }
}
