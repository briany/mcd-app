import SwiftUI
import MCDCore

public struct CouponCardView: View {
    let coupon: Coupon

    public init(coupon: Coupon) {
        self.coupon = coupon
    }

    public var body: some View {
        HStack(spacing: 16) {
            // Coupon Image
            AsyncImage(url: URL(string: coupon.imageUrl ?? "")) { phase in
                switch phase {
                case .empty:
                    placeholderImage
                case .success(let image):
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                case .failure:
                    placeholderImage
                @unknown default:
                    placeholderImage
                }
            }
            .frame(width: 80, height: 80)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Coupon Details
            VStack(alignment: .leading, spacing: 8) {
                Text(coupon.name)
                    .font(.headline)
                    .lineLimit(2)

                HStack(spacing: 4) {
                    Image(systemName: "calendar")
                        .font(.caption)
                    Text("Expires: \(coupon.expiryDate)")
                        .font(.caption)
                        .foregroundColor(expiryColor)
                }

                HStack(spacing: 8) {
                    // Status Badge
                    Text(coupon.status.capitalized)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .clipShape(Capsule())

                    // Days Remaining
                    if let days = coupon.daysUntilExpiry, days >= 0 {
                        Text("\(days) days left")
                            .font(.caption)
                            .foregroundColor(expiryColor)
                    }
                }
            }

            Spacer()
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }

    private var placeholderImage: some View {
        Rectangle()
            .fill(Color.gray.opacity(0.2))
            .overlay {
                Image(systemName: "photo")
                    .font(.title)
                    .foregroundColor(.gray)
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
    CouponCardView(coupon: Coupon(
        id: "1",
        name: "Big Mac Meal Deal",
        imageUrl: nil,
        expiryDate: "2026-01-25",
        status: "active"
    ))
    .padding()
    .frame(width: 400)
}
