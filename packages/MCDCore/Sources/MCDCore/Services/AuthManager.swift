import Foundation
import AuthenticationServices

public enum AuthProvider: String, Codable {
    case google
    case github
}

public struct AuthToken: Codable {
    public let accessToken: String
    public let refreshToken: String?
    public let expiresAt: Date
    public let provider: String
    public let userId: String
    public let email: String?
    public let name: String?
    public let picture: String?

    public var isExpired: Bool {
        Date() >= expiresAt
    }
}

public enum AuthError: LocalizedError {
    case notAuthenticated
    case tokenExpired
    case invalidCallback
    case cancelled
    case keychainError(OSStatus)
    case networkError(Error)

    public var errorDescription: String? {
        switch self {
        case .notAuthenticated:
            return "Not authenticated. Please sign in."
        case .tokenExpired:
            return "Session expired. Please sign in again."
        case .invalidCallback:
            return "Invalid authentication response."
        case .cancelled:
            return "Sign in was cancelled."
        case .keychainError(let status):
            return "Keychain error: \(status)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        }
    }
}

@MainActor
public class AuthManager: ObservableObject {
    @Published public var isAuthenticated = false
    @Published public var currentUser: (id: String, email: String?, name: String?, picture: String?)? = nil
    @Published public var isLoading = false
    @Published public var errorMessage: String?

    private let keychainService = "com.mcdapp.auth"
    private let tokenKey = "authToken"

    public static let shared = AuthManager()

    private init() {
        // Check for existing valid token on init
        if let token = loadToken(), !token.isExpired {
            isAuthenticated = true
            currentUser = (token.userId, token.email, token.name, token.picture)
        }
    }

    // MARK: - Public Methods

    public func signIn(provider: AuthProvider) async {
        isLoading = true
        errorMessage = nil

        do {
            // Build OAuth URL
            let authURL = buildAuthURL(provider: provider)

            // Present web authentication session
            let callbackURL = try await presentWebAuth(url: authURL)

            // Parse token from callback URL
            let token = try parseCallback(url: callbackURL, provider: provider)

            // Save to Keychain
            try saveToken(token)

            isAuthenticated = true
            currentUser = (token.userId, token.email, token.name, token.picture)
        } catch AuthError.cancelled {
            // User cancelled - not an error to display
            errorMessage = nil
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    public func signOut() {
        deleteToken()
        isAuthenticated = false
        currentUser = nil
        errorMessage = nil
    }

    public func getValidAccessToken() throws -> String {
        guard let token = loadToken(), !token.isExpired else {
            throw AuthError.tokenExpired
        }
        return token.accessToken
    }

    // MARK: - Private Methods

    private func buildAuthURL(provider: AuthProvider) -> URL {
        let baseURL = MCDConfiguration.webAppURL
        let callbackScheme = "mcdapp"

        // NextAuth OAuth URL - this triggers the OAuth flow
        var components = URLComponents(string: "\(baseURL)/api/auth/signin/\(provider.rawValue)")!
        components.queryItems = [
            URLQueryItem(name: "callbackUrl", value: "\(callbackScheme)://auth/callback")
        ]

        return components.url!
    }

    private func presentWebAuth(url: URL) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: "mcdapp"
            ) { callbackURL, error in
                if let error = error {
                    if (error as NSError).code == ASWebAuthenticationSessionError.canceledLogin.rawValue {
                        continuation.resume(throwing: AuthError.cancelled)
                    } else {
                        continuation.resume(throwing: AuthError.networkError(error))
                    }
                    return
                }

                guard let callbackURL = callbackURL else {
                    continuation.resume(throwing: AuthError.invalidCallback)
                    return
                }

                continuation.resume(returning: callbackURL)
            }

            session.presentationContextProvider = WebAuthPresentationContext.shared
            session.prefersEphemeralWebBrowserSession = false

            if !session.start() {
                continuation.resume(throwing: AuthError.invalidCallback)
            }
        }
    }

    private func parseCallback(url: URL, provider: AuthProvider) throws -> AuthToken {
        guard let components = URLComponents(url: url, resolvingAgainstBaseURL: false),
              let queryItems = components.queryItems else {
            throw AuthError.invalidCallback
        }

        let params = Dictionary(uniqueKeysWithValues: queryItems.compactMap { item -> (String, String)? in
            guard let value = item.value else { return nil }
            return (item.name, value)
        })

        // NextAuth returns session token in callback
        guard let sessionToken = params["token"] ?? params["session_token"] else {
            #if DEBUG
            // For development only: create a mock token if no token in callback
            // This allows testing the auth flow without a real OAuth server
            return AuthToken(
                accessToken: UUID().uuidString,
                refreshToken: nil,
                expiresAt: Date().addingTimeInterval(24 * 60 * 60), // 24 hours
                provider: provider.rawValue,
                userId: params["userId"] ?? UUID().uuidString,
                email: params["email"],
                name: params["name"],
                picture: params["picture"]
            )
            #else
            throw AuthError.invalidCallback
            #endif
        }

        return AuthToken(
            accessToken: sessionToken,
            refreshToken: params["refresh_token"],
            expiresAt: Date().addingTimeInterval(24 * 60 * 60), // 24 hours
            provider: provider.rawValue,
            userId: params["userId"] ?? UUID().uuidString,
            email: params["email"],
            name: params["name"],
            picture: params["picture"]
        )
    }

    // MARK: - Keychain Helpers

    private func saveToken(_ token: AuthToken) throws {
        let data = try JSONEncoder().encode(token)

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: tokenKey,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleAfterFirstUnlock
        ]

        // Delete existing
        SecItemDelete(query as CFDictionary)

        // Add new
        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw AuthError.keychainError(status)
        }
    }

    private func loadToken() -> AuthToken? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: tokenKey,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let token = try? JSONDecoder().decode(AuthToken.self, from: data) else {
            return nil
        }

        return token
    }

    private func deleteToken() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: keychainService,
            kSecAttrAccount as String: tokenKey
        ]

        SecItemDelete(query as CFDictionary)
    }
}

// MARK: - Presentation Context Provider

private class WebAuthPresentationContext: NSObject, ASWebAuthenticationPresentationContextProviding {
    static let shared = WebAuthPresentationContext()

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        #if os(iOS)
        return UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
        #else
        return NSApplication.shared.windows.first ?? ASPresentationAnchor()
        #endif
    }
}
