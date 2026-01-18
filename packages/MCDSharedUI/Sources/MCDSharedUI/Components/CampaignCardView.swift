import SwiftUI
import MCDCore

public struct CampaignCardView: View {
    let campaign: Campaign

    public init(campaign: Campaign) {
        self.campaign = campaign
    }

    public var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // Header: Title + Status Badge
            HStack {
                Text(campaign.title)
                    .font(.headline)
                    .lineLimit(2)

                Spacer()

                statusBadge
            }

            // Description
            Text(campaign.description)
                .font(.body)
                .foregroundColor(.secondary)
                .lineLimit(3)

            // Footer: Date Range + Subscription Status
            HStack(spacing: 16) {
                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                    Text("\(campaign.startDate) - \(campaign.endDate)")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                if campaign.isSubscribed {
                    HStack(spacing: 4) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.caption)
                            .foregroundColor(.green)
                        Text("Subscribed")
                            .font(.caption)
                            .foregroundColor(.green)
                    }
                }

                Spacer()
            }
        }
        .padding()
        .background(Color(NSColor.controlBackgroundColor))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    @ViewBuilder
    private var statusBadge: some View {
        switch campaign.status {
        case .ongoing:
            Text("Ongoing")
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.green)
                .foregroundColor(.white)
                .clipShape(Capsule())
        case .upcoming:
            Text("Upcoming")
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.blue)
                .foregroundColor(.white)
                .clipShape(Capsule())
        case .past:
            Text("Past")
                .font(.caption)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(Color.gray)
                .foregroundColor(.white)
                .clipShape(Capsule())
        case .unknown:
            EmptyView()
        }
    }
}

#Preview {
    CampaignCardView(campaign: Campaign(
        id: "1",
        title: "Spring Festival 2026",
        description: "Enjoy special discounts and exclusive menu items during our Spring Festival celebration!",
        imageUrl: nil,
        startDate: "2026-03-01",
        endDate: "2026-03-31",
        isSubscribed: true
    ))
    .padding()
    .frame(width: 500)
}
