import SwiftUI
import MCDCore

@main
struct MCDmacOSApp: App {
    @ObservedObject private var authManager = AuthManager.shared

    var body: some Scene {
        WindowGroup {
            if authManager.isAuthenticated {
                ContentView()
            } else {
                SignInView()
            }
        }
        .windowStyle(.hiddenTitleBar)
        .windowResizability(.contentSize)
        .defaultSize(width: 900, height: 700)
    }
}
