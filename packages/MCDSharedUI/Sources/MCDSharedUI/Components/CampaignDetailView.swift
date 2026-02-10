import SwiftUI
import MCDCore

/// A detail view that displays the full markdown content of a campaign
public struct CampaignDetailView: View {
    let campaign: Campaign
    @Environment(\.dismiss) private var dismiss

    public init(campaign: Campaign) {
        self.campaign = campaign
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Header Image
                    if let imageUrl = campaign.imageUrl, let url = URL(string: imageUrl) {
                        AsyncImage(url: url) { phase in
                            switch phase {
                            case .empty:
                                ProgressView()
                                    .frame(maxWidth: .infinity)
                                    .frame(height: 200)
                            case .success(let image):
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fit)
                                    .frame(maxWidth: .infinity)
                                    .frame(maxHeight: 200)
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            case .failure:
                                EmptyView()
                            @unknown default:
                                EmptyView()
                            }
                        }
                    }

                    // Campaign Title
                    Text(campaign.title)
                        .font(.title2)
                        .fontWeight(.bold)

                    // Status and Date Range
                    HStack(spacing: 12) {
                        // Status Badge
                        statusBadge

                        // Date Range
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .font(.caption)
                            Text("\(campaign.startDate) - \(campaign.endDate)")
                                .font(.caption)
                        }
                        .foregroundColor(.secondary)

                        // Subscription Status
                        if campaign.isSubscribed {
                            HStack(spacing: 4) {
                                Image(systemName: "checkmark.circle.fill")
                                    .font(.caption)
                                Text("Subscribed")
                                    .font(.caption)
                            }
                            .foregroundColor(.green)
                        }
                    }

                    Divider()

                    // Markdown Content
                    if let rawMarkdown = campaign.rawMarkdown {
                        SharedMarkdownContentView(markdown: rawMarkdown)
                    } else {
                        Text("No additional details available.")
                            .foregroundColor(.secondary)
                            .italic()
                    }
                }
                .padding()
            }
            .navigationTitle("Campaign Details")
            #if os(iOS)
            .navigationBarTitleDisplayMode(.inline)
            #endif
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }

    @ViewBuilder
    private var statusBadge: some View {
        switch campaign.status {
        case .ongoing:
            Text("Ongoing")
                .font(.caption)
                .fontWeight(.semibold)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.green.opacity(0.2))
                .foregroundColor(.green)
                .clipShape(Capsule())
        case .upcoming:
            Text("Upcoming")
                .font(.caption)
                .fontWeight(.semibold)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.blue.opacity(0.2))
                .foregroundColor(.blue)
                .clipShape(Capsule())
        case .past:
            Text("Past")
                .font(.caption)
                .fontWeight(.semibold)
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(Color.gray.opacity(0.2))
                .foregroundColor(.gray)
                .clipShape(Capsule())
        case .unknown:
            EmptyView()
        }
    }
}

#Preview {
    CampaignDetailView(campaign: Campaign(
        id: "1",
        title: "Spring Festival 2026",
        description: "Enjoy special discounts and exclusive menu items!",
        imageUrl: "https://via.placeholder.com/300x200",
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isSubscribed: true,
        rawMarkdown: """
        ## Spring Festival 2026

        - **活动时间**: 2026-03-01 - 2026-03-31
        - **活动内容**: 春节限定套餐享8折优惠

        <img src="https://via.placeholder.com/300x200" />

        Celebrate the Spring Festival with exclusive deals!
        """
    ))
}
