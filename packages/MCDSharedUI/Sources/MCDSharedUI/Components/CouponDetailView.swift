import SwiftUI
import MCDCore

/// A detail view that displays the full markdown content of a coupon
public struct CouponDetailView: View {
    let coupon: Coupon
    @Environment(\.dismiss) private var dismiss

    public init(coupon: Coupon) {
        self.coupon = coupon
    }

    public var body: some View {
        NavigationStack {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    // Header Image
                    if let imageUrl = coupon.imageUrl, let url = URL(string: imageUrl) {
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

                    // Coupon Name
                    Text(coupon.name)
                        .font(.title2)
                        .fontWeight(.bold)

                    // Status and Expiry
                    HStack(spacing: 12) {
                        // Status Badge
                        Text(coupon.status.capitalized)
                            .font(.caption)
                            .fontWeight(.semibold)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(statusColor.opacity(0.2))
                            .foregroundColor(statusColor)
                            .clipShape(Capsule())

                        // Expiry
                        HStack(spacing: 4) {
                            Image(systemName: "calendar")
                                .font(.caption)
                            Text("Expires: \(coupon.expiryDate)")
                                .font(.caption)
                        }
                        .foregroundColor(expiryColor)
                    }

                    Divider()

                    // Markdown Content
                    if let rawMarkdown = coupon.rawMarkdown {
                        SharedMarkdownContentView(markdown: rawMarkdown)
                    } else {
                        Text("No additional details available.")
                            .foregroundColor(.secondary)
                            .italic()
                    }
                }
                .padding()
            }
            .navigationTitle("Coupon Details")
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

    private var statusColor: Color {
        switch coupon.status.lowercased() {
        case "active", "available":
            return .green
        case "claimed":
            return .blue
        case "expired":
            return .red
        default:
            return .gray
        }
    }

    private var expiryColor: Color {
        switch coupon.expiryWarningLevel {
        case .expired, .critical:
            return .red
        case .warning:
            return .orange
        case .none:
            return .secondary
        }
    }
}

#Preview {
    CouponDetailView(coupon: Coupon(
        id: "1",
        name: "Big Mac Meal Deal",
        imageUrl: "https://via.placeholder.com/300x200",
        expiryDate: "2026-02-15",
        status: "active",
        rawMarkdown: """
        ## Big Mac Meal Deal

        - **有效期**: 2026-01-15 - 2026-02-15
        - **使用条件**: 单笔订单满30元可用

        <img src="https://via.placeholder.com/300x200" />

        Get a delicious Big Mac meal at a special price!
        """
    ))
}
