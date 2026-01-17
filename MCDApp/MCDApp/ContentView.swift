import SwiftUI

struct ContentView: View {
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
        }
        .frame(minWidth: 800, minHeight: 600)
    }
}

#Preview {
    ContentView()
}
