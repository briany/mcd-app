import SwiftUI
import MCDCore
import MCDSharedUI

struct CampaignsView: View {
    @StateObject private var viewModel = CampaignViewModel()
    @State private var searchText = ""
    @State private var selectedCampaign: Campaign?

    var body: some View {
        VStack(spacing: 0) {
            // Top Section: Date Picker and Filter
            VStack(spacing: 16) {
                // Date Picker
                DatePicker("Select Date", selection: $viewModel.selectedDate, displayedComponents: .date)
                    .datePickerStyle(.graphical)
                    .onChange(of: viewModel.selectedDate) { _, newDate in
                        Task {
                            await viewModel.fetchCampaigns(for: newDate)
                        }
                    }

                // Filter Picker
                Picker("Filter", selection: $viewModel.filterStatus) {
                    Text("All").tag(nil as Campaign.CampaignStatus?)
                    Text("Ongoing").tag(Campaign.CampaignStatus.ongoing as Campaign.CampaignStatus?)
                    Text("Past").tag(Campaign.CampaignStatus.past as Campaign.CampaignStatus?)
                    Text("Upcoming").tag(Campaign.CampaignStatus.upcoming as Campaign.CampaignStatus?)
                }
                .pickerStyle(.segmented)
            }
            .padding()
            .background(Color(NSColor.controlBackgroundColor))

            Divider()

            // Content Section
            Group {
                if viewModel.isLoading {
                    VStack(spacing: 16) {
                        ProgressView()
                        Text("Loading campaigns...")
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if searchResults.isEmpty {
                    VStack(spacing: 16) {
                        Image(systemName: "calendar.badge.exclamationmark")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        Text("No campaigns found")
                            .font(.headline)
                        Text("Try selecting a different date")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(searchResults) { campaign in
                                CampaignCardView(campaign: campaign)
                                    .contentShape(Rectangle())
                                    .onTapGesture {
                                        selectedCampaign = campaign
                                    }
                            }
                        }
                        .padding()
                    }
                }
            }
        }
        .searchable(text: $searchText, prompt: "Search campaigns")
        .toolbar {
            ToolbarItem(placement: .automatic) {
                Button(action: {
                    Task {
                        await viewModel.refresh()
                    }
                }) {
                    Label("Refresh", systemImage: "arrow.clockwise")
                }
                .disabled(viewModel.isLoading)
            }
        }
        .alert("Error", isPresented: Binding(
            get: { viewModel.errorMessage != nil },
            set: { newValue in
                if !newValue {
                    viewModel.errorMessage = nil
                }
            }
        )) {
            Button("OK") {
                viewModel.errorMessage = nil
            }
        } message: {
            if let errorMessage = viewModel.errorMessage {
                Text(errorMessage)
            }
        }
        .task {
            await viewModel.fetchCampaigns(for: viewModel.selectedDate)
        }
        .sheet(item: $selectedCampaign) { campaign in
            CampaignDetailView(campaign: campaign)
        }
    }

    // MARK: - Computed Properties

    private var searchResults: [Campaign] {
        if searchText.isEmpty {
            return viewModel.filteredCampaigns
        }
        return viewModel.filteredCampaigns.filter { campaign in
            campaign.title.localizedCaseInsensitiveContains(searchText) ||
            campaign.description.localizedCaseInsensitiveContains(searchText)
        }
    }
}

#Preview {
    CampaignsView()
        .frame(width: 600, height: 800)
}
