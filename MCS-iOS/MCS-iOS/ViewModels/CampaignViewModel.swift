import Foundation
import SwiftUI

@MainActor
class CampaignViewModel: ObservableObject {
    @Published var campaigns: [Campaign] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var selectedDate: Date = Date()
    @Published var filterStatus: Campaign.CampaignStatus? = nil

    private let client = MCPClient.shared

    // MARK: - Computed Properties

    var filteredCampaigns: [Campaign] {
        guard let status = filterStatus else {
            return campaigns
        }
        return campaigns.filter { $0.status == status }
    }

    // MARK: - Public Methods

    func fetchCampaigns(for date: Date? = nil) async {
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

    func refresh() async {
        await client.clearCache()
        await fetchCampaigns(for: selectedDate)
    }
}
