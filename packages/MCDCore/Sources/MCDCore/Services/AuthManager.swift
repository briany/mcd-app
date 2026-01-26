import Foundation
import AuthenticationServices
#if canImport(GoogleSignIn)
import GoogleSignIn
#endif
#if canImport(UIKit)
import UIKit
#endif
#if canImport(AppKit)
import AppKit
#endif

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
    case configurationError(String)
    case deviceFlowError(String)

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
        case .configurationError(let message):
            return "Configuration error: \(message)"
        case .deviceFlowError(let message):
            return message
        }
    }
}

// MARK: - GitHub Device Flow Types

private struct GitHubDeviceCodeResponse: Codable {
    let deviceCode: String
    let userCode: String
    let verificationUri: String
    let expiresIn: Int
    let interval: Int

    enum CodingKeys: String, CodingKey {
        case deviceCode = "device_code"
        case userCode = "user_code"
        case verificationUri = "verification_uri"
        case expiresIn = "expires_in"
        case interval
    }
}

private struct GitHubTokenResponse: Codable {
    let accessToken: String?
    let tokenType: String?
    let scope: String?
    let error: String?
    let errorDescription: String?

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case tokenType = "token_type"
        case scope
        case error
        case errorDescription = "error_description"
    }
}

private struct GitHubUser: Codable {
    let id: Int
    let login: String
    let name: String?
    let email: String?
    let avatarUrl: String?

    enum CodingKeys: String, CodingKey {
        case id, login, name, email
        case avatarUrl = "avatar_url"
    }
}

@MainActor
public class AuthManager: ObservableObject {
    @Published public var isAuthenticated = false
    @Published public var currentUser: (id: String, email: String?, name: String?, picture: String?)? = nil
    @Published public var isLoading = false
    @Published public var errorMessage: String?

    // GitHub Device Flow state
    @Published public var deviceFlowUserCode: String?
    @Published public var deviceFlowVerificationURL: String?
    @Published public var isWaitingForDeviceAuth = false

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
            let token: AuthToken
            switch provider {
            case .google:
                token = try await signInWithGoogle()
            case .github:
                token = try await signInWithGitHub()
            }

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
        isWaitingForDeviceAuth = false
        deviceFlowUserCode = nil
        deviceFlowVerificationURL = nil
    }

    public func signOut() {
        #if canImport(GoogleSignIn)
        GIDSignIn.sharedInstance.signOut()
        #endif
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

    // MARK: - Google Sign-In

    private func signInWithGoogle() async throws -> AuthToken {
        #if canImport(GoogleSignIn)
        // Get Google Client ID from Info.plist or configuration
        guard let clientID = getGoogleClientID() else {
            throw AuthError.configurationError("Google Client ID not configured. Add GOOGLE_CLIENT_ID to Config.plist")
        }

        let config = GIDConfiguration(clientID: clientID)
        GIDSignIn.sharedInstance.configuration = config

        #if canImport(UIKit)
        // iOS: Get the presenting view controller
        guard let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
              let rootViewController = windowScene.windows.first?.rootViewController else {
            throw AuthError.configurationError("Unable to get root view controller")
        }

        // Perform sign in
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: rootViewController)
        #elseif canImport(AppKit)
        // macOS: Get the presenting window
        guard let window = NSApplication.shared.windows.first else {
            throw AuthError.configurationError("Unable to get presenting window")
        }

        // Perform sign in
        let result = try await GIDSignIn.sharedInstance.signIn(withPresenting: window)
        #else
        throw AuthError.configurationError("Google Sign-In not available on this platform")
        #endif

        let user = result.user

        guard let idToken = user.idToken?.tokenString else {
            throw AuthError.invalidCallback
        }

        return AuthToken(
            accessToken: user.accessToken.tokenString,
            refreshToken: user.refreshToken.tokenString,
            expiresAt: user.accessToken.expirationDate ?? Date().addingTimeInterval(3600),
            provider: AuthProvider.google.rawValue,
            userId: user.userID ?? UUID().uuidString,
            email: user.profile?.email,
            name: user.profile?.name,
            picture: user.profile?.imageURL(withDimension: 200)?.absoluteString
        )
        #else
        throw AuthError.configurationError("Google Sign-In not available on this platform")
        #endif
    }

    // MARK: - Config Helpers

    /// Find Config.plist from various sources (Bundle.main, all bundles, SPM resource bundles)
    private func findConfigPlist() -> NSDictionary? {
        // 1. Try Bundle.main (works for .app bundles)
        if let configPath = Bundle.main.path(forResource: "Config", ofType: "plist"),
           let config = NSDictionary(contentsOfFile: configPath) {
            return config
        }

        // 2. Try all loaded bundles
        for bundle in Bundle.allBundles {
            if let configPath = bundle.path(forResource: "Config", ofType: "plist"),
               let config = NSDictionary(contentsOfFile: configPath) {
                return config
            }
        }

        // 3. Try SPM resource bundle next to executable (for SPM executables)
        let executableURL = URL(fileURLWithPath: CommandLine.arguments[0])
        let executableDir = executableURL.deletingLastPathComponent()

        // SPM names resource bundles as "{PackageName}_{TargetName}.bundle"
        let bundlePatterns = [
            "MCD-macOS_MCDApp.bundle",
            "MCD-iOS_MCDApp.bundle",
            "MCDApp.bundle"
        ]

        for pattern in bundlePatterns {
            let bundlePath = executableDir.appendingPathComponent(pattern)
            if let bundle = Bundle(url: bundlePath),
               let configPath = bundle.path(forResource: "Config", ofType: "plist"),
               let config = NSDictionary(contentsOfFile: configPath) {
                return config
            }
        }

        return nil
    }

    private func getGoogleClientID() -> String? {
        // Try Config.plist first (from various sources)
        if let config = findConfigPlist(),
           let clientID = config["GOOGLE_CLIENT_ID"] as? String,
           !clientID.isEmpty,
           clientID != "YOUR_GOOGLE_CLIENT_ID" {
            return clientID
        }

        // Try environment variable
        if let clientID = ProcessInfo.processInfo.environment["GOOGLE_CLIENT_ID"],
           !clientID.isEmpty {
            return clientID
        }

        // Try Info.plist (where Google recommends storing it)
        if let clientID = Bundle.main.object(forInfoDictionaryKey: "GIDClientID") as? String,
           !clientID.isEmpty {
            return clientID
        }

        return nil
    }

    // MARK: - GitHub Device Flow

    /// GitHub OAuth using Device Authorization Flow
    /// This flow doesn't require a client secret in the app - more secure for mobile
    private func signInWithGitHub() async throws -> AuthToken {
        guard let clientID = getGitHubClientID() else {
            throw AuthError.configurationError("GitHub Client ID not configured. Add GITHUB_CLIENT_ID to Config.plist")
        }

        // Step 1: Request device code
        let deviceCode = try await requestGitHubDeviceCode(clientID: clientID)

        // Update UI with user code for display
        await MainActor.run {
            self.deviceFlowUserCode = deviceCode.userCode
            self.deviceFlowVerificationURL = deviceCode.verificationUri
            self.isWaitingForDeviceAuth = true
        }

        // Open verification URL in browser
        if let url = URL(string: deviceCode.verificationUri) {
            #if canImport(UIKit)
            await UIApplication.shared.open(url)
            #elseif canImport(AppKit)
            NSWorkspace.shared.open(url)
            #endif
        }

        // Step 2: Poll for token
        let tokenResponse = try await pollForGitHubToken(
            clientID: clientID,
            deviceCode: deviceCode.deviceCode,
            interval: deviceCode.interval,
            expiresIn: deviceCode.expiresIn
        )

        // Step 3: Get user info
        let user = try await fetchGitHubUser(accessToken: tokenResponse.accessToken!)

        return AuthToken(
            accessToken: tokenResponse.accessToken!,
            refreshToken: nil,
            expiresAt: Date().addingTimeInterval(365 * 24 * 60 * 60), // GitHub tokens don't expire
            provider: AuthProvider.github.rawValue,
            userId: String(user.id),
            email: user.email,
            name: user.name ?? user.login,
            picture: user.avatarUrl
        )
    }

    private func getGitHubClientID() -> String? {
        // Try Config.plist first (from various sources)
        if let config = findConfigPlist(),
           let clientID = config["GITHUB_CLIENT_ID"] as? String,
           !clientID.isEmpty,
           clientID != "YOUR_GITHUB_CLIENT_ID" {
            return clientID
        }

        // Try environment variable
        if let clientID = ProcessInfo.processInfo.environment["GITHUB_CLIENT_ID"],
           !clientID.isEmpty {
            return clientID
        }

        return nil
    }

    private func requestGitHubDeviceCode(clientID: String) async throws -> GitHubDeviceCodeResponse {
        var request = URLRequest(url: URL(string: "https://github.com/login/device/code")!)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

        let body = "client_id=\(clientID)&scope=user:email"
        request.httpBody = body.data(using: .utf8)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw AuthError.networkError(NSError(domain: "GitHub", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to request device code"]))
        }

        return try JSONDecoder().decode(GitHubDeviceCodeResponse.self, from: data)
    }

    private func pollForGitHubToken(clientID: String, deviceCode: String, interval: Int, expiresIn: Int) async throws -> GitHubTokenResponse {
        let startTime = Date()
        let expirationDate = startTime.addingTimeInterval(TimeInterval(expiresIn))
        var pollInterval = TimeInterval(interval)

        while Date() < expirationDate {
            try await Task.sleep(nanoseconds: UInt64(pollInterval * 1_000_000_000))

            var request = URLRequest(url: URL(string: "https://github.com/login/oauth/access_token")!)
            request.httpMethod = "POST"
            request.setValue("application/json", forHTTPHeaderField: "Accept")
            request.setValue("application/x-www-form-urlencoded", forHTTPHeaderField: "Content-Type")

            let body = "client_id=\(clientID)&device_code=\(deviceCode)&grant_type=urn:ietf:params:oauth:grant-type:device_code"
            request.httpBody = body.data(using: .utf8)

            let (data, _) = try await URLSession.shared.data(for: request)
            let tokenResponse = try JSONDecoder().decode(GitHubTokenResponse.self, from: data)

            if let accessToken = tokenResponse.accessToken, !accessToken.isEmpty {
                return tokenResponse
            }

            if let error = tokenResponse.error {
                switch error {
                case "authorization_pending":
                    // User hasn't completed auth yet, keep polling
                    continue
                case "slow_down":
                    // GitHub wants us to slow down
                    pollInterval += 5
                    continue
                case "expired_token":
                    throw AuthError.deviceFlowError("Authentication timed out. Please try again.")
                case "access_denied":
                    throw AuthError.cancelled
                default:
                    throw AuthError.deviceFlowError(tokenResponse.errorDescription ?? error)
                }
            }
        }

        throw AuthError.deviceFlowError("Authentication timed out. Please try again.")
    }

    private func fetchGitHubUser(accessToken: String) async throws -> GitHubUser {
        var request = URLRequest(url: URL(string: "https://api.github.com/user")!)
        request.setValue("Bearer \(accessToken)", forHTTPHeaderField: "Authorization")
        request.setValue("application/vnd.github+json", forHTTPHeaderField: "Accept")

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse, httpResponse.statusCode == 200 else {
            throw AuthError.networkError(NSError(domain: "GitHub", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to fetch user info"]))
        }

        return try JSONDecoder().decode(GitHubUser.self, from: data)
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
