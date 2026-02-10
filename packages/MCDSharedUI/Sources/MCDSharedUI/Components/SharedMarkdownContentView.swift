import SwiftUI

/// Shared markdown renderer used by coupon and campaign detail screens.
struct SharedMarkdownContentView: View {
    let markdown: String

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            ForEach(parseMarkdown(), id: \.self) { element in
                renderElement(element)
            }
        }
    }

    private func parseMarkdown() -> [SharedMarkdownElement] {
        var elements: [SharedMarkdownElement] = []
        let lines = markdown.components(separatedBy: "\n")

        for line in lines {
            let trimmed = line.trimmingCharacters(in: .whitespaces)

            if trimmed.isEmpty {
                continue
            }

            if let imageUrl = extractImageUrl(from: trimmed) {
                elements.append(.image(url: imageUrl))
                continue
            }

            if trimmed.hasPrefix("## ") {
                let text = String(trimmed.dropFirst(3))
                elements.append(.heading(text: text))
                continue
            }

            if trimmed.hasPrefix("- ") {
                let text = String(trimmed.dropFirst(2))
                elements.append(.listItem(text: parseInlineFormatting(text)))
                continue
            }

            elements.append(.paragraph(text: parseInlineFormatting(trimmed)))
        }

        return elements
    }

    private func extractImageUrl(from line: String) -> String? {
        guard line.contains("<img"), line.contains("src=") else { return nil }

        guard let srcRange = line.range(of: #"src="([^"]+)""#, options: .regularExpression) else {
            return nil
        }

        let match = String(line[srcRange])
        return match
            .replacingOccurrences(of: #"src=""#, with: "")
            .replacingOccurrences(of: #"""#, with: "")
    }

    private func parseInlineFormatting(_ text: String) -> AttributedString {
        let normalized = text.replacingOccurrences(of: "**", with: "")

        do {
            return try AttributedString(markdown: normalized)
        } catch {
            return AttributedString(normalized)
        }
    }

    @ViewBuilder
    private func renderElement(_ element: SharedMarkdownElement) -> some View {
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

private enum SharedMarkdownElement: Hashable {
    case heading(text: String)
    case paragraph(text: AttributedString)
    case listItem(text: AttributedString)
    case image(url: String)
}
