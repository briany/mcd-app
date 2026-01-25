import SwiftUI
import MCDCore

@main
struct MCDiOSApp: App {
    @StateObject private var authManager = AuthManager.shared

    var body: some Scene {
        WindowGroup {
            if authManager.isAuthenticated {
                ContentView()
            } else {
                SignInView()
            }
        }
    }
}
