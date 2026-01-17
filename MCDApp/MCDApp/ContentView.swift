import SwiftUI

struct ContentView: View {
    var body: some View {
        TabView {
            Text("My Coupons")
                .tabItem {
                    Label("My Coupons", systemImage: "ticket.fill")
                }

            Text("Campaigns")
                .tabItem {
                    Label("Campaigns", systemImage: "calendar")
                }

            Text("Available")
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
