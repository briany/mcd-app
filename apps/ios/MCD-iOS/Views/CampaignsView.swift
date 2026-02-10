import SwiftUI
import MCDCore
import MCDSharedUI

struct CampaignsView: View {
    @StateObject private var viewModel = CampaignViewModel()
    @State private var searchText = ""
    @State private var showingDatePicker = false
    @State private var selectedCampaign: Campaign?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Top Section: Date Selection and Filter
                VStack(spacing: 16) {
                    // Date Selection Button
                    Button(action: {
                        showingDatePicker.toggle()
                    }) {
                        HStack {
                            Image(systemName: "calendar")
                            Text(formattedDate)
                            Spacer()
                            Image(systemName: "chevron.down")
                        }
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(10)
                    }
                    .foregroundColor(.primary)

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
            .navigationTitle("Campaigns")
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
            .sheet(isPresented: $showingDatePicker) {
                NavigationStack {
                    DatePicker("Select Date", selection: $viewModel.selectedDate, displayedComponents: .date)
                        .datePickerStyle(.graphical)
                        .padding()
                        .navigationTitle("Select Date")
                        .navigationBarTitleDisplayMode(.inline)
                        .toolbar {
                            ToolbarItem(placement: .confirmationAction) {
                                Button("Done") {
                                    showingDatePicker = false
                                    Task {
                                        await viewModel.fetchCampaigns(for: viewModel.selectedDate)
                                    }
                                }
                            }
                        }
                }
                .presentationDetents([.medium])
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
    }

    // MARK: - Computed Properties

    private var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: viewModel.selectedDate)
    }

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
}
