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
                        MarkdownContentView(markdown: rawMarkdown)
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

/// A view that renders markdown content with images
struct MarkdownContentView: View {
    let markdown: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(parseMarkdown(), id: \.self) { element in
                renderElement(element)
            }
        }
    }

    private func parseMarkdown() -> [MarkdownElement] {
        var elements: [MarkdownElement] = []
        let lines = markdown.components(separatedBy: "\n")

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            // Skip empty lines
            if trimmed.isEmpty {
                continue
            }

            // Check for image tag
            if let imageUrl = extractImageUrl(from: trimmed) {
                elements.append(.image(url: imageUrl))
                continue
            }

            // Check for heading
            if trimmed.hasPrefix("## ") {
                let text = String(trimmed.dropFirst(3))
                elements.append(.heading(text: text))
                continue
            }

            // Check for list item
            if trimmed.hasPrefix("- ") {
                let text = String(trimmed.dropFirst(2))
                elements.append(.listItem(text: parseInlineFormatting(text)))
                continue
            }

            // Regular paragraph
            elements.append(.paragraph(text: parseInlineFormatting(trimmed)))
        }

        return elements
    }

    private func extractImageUrl(from line: String) -> String? {
        guard line.contains("<img") && line.contains("src=") else { return nil }

        // Extract URL from <img src="..." pattern
        guard let srcRange = line.range(of: #"src="([^"]+)""#, options: .regularExpression) else {
            return nil
        }

        let match = String(line[srcRange])
        let url = match.replacingOccurrences(of: #"src=""#, with: "").replacingOccurrences(of: #"""#, with: "")
        return url
    }

    private func parseInlineFormatting(_ text: String) -> AttributedString {
        var result = text

        // Remove ** markers for bold (we'll handle styling in the view)
        result = result.replacingOccurrences(of: "**", with: "")

        // Convert to AttributedString
        do {
            return try AttributedString(markdown: result)
        } catch {
            return AttributedString(result)
        }
    }

    @ViewBuilder
    private func renderElement(_ element: MarkdownElement) -> some View {
        switch element {
        case .heading(let text):
            Text(text)
                .font(.headline)
                .fontWeight(.semibold)
                .padding(.top, 8)

        case .paragraph(let text):
            Text(text)
                .font(.body)

        case .listItem(let text):
            HStack(alignment: .top, spacing: 8) {
                Text("\u{2022}")
                    .font(.body)
                Text(text)
                    .font(.body)
            }

        case .image(let url):
            if let imageUrl = URL(string: url) {
                AsyncImage(url: imageUrl) { phase in
                    switch phase {
                    case .empty:
                        ProgressView()
                            .frame(maxWidth: .infinity)
                            .frame(height: 150)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                            .frame(maxWidth: .infinity)
                            .frame(maxHeight: 200)
                            .clipShape(RoundedRectangle(cornerRadius: 8))
                    case .failure:
                        EmptyView()
                    @unknown default:
                        EmptyView()
                    }
                }
            }
        }
    }
}

enum MarkdownElement: Hashable {
    case heading(text: String)
    case paragraph(text: AttributedString)
    case listItem(text: AttributedString)
    case image(url: String)
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
