import SwiftUI
import MCDSharedUI
import MCDCore

struct ContentView: View {
    @ObservedObject private var authManager = AuthManager.shared

    var body: some View {
        TabView {
            MyCouponsView()
                .tabItem {
                    Label("My Coupons", systemImage: "ticket.fill")
                }

            CampaignsView()
                .tabItem {
                    Label("Campaigns", systemImage: "calendar")
                }

            AvailableCouponsView()
                .tabItem {
                    Label("Available", systemImage: "plus.circle.fill")
                }

            SettingsView(authManager: authManager)
                .tabItem {
                    Label("Settings", systemImage: "gearshape.fill")
                }
        }
    }
}

#Preview {
    ContentView()
}
