import SwiftUI

struct MyCouponsView: View {
    @StateObject private var viewModel = CouponViewModel()

    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.isLoading {
                    // Loading State
                    VStack {
                        ProgressView()
                        Text("Loading coupons...")
                            .foregroundColor(.secondary)
                            .padding(.top, 8)
                    }
                } else if viewModel.myCoupons.isEmpty {
                    // Empty State
                    VStack(spacing: 16) {
                        Image(systemName: "ticket")
                            .font(.system(size: 60))
                            .foregroundColor(.secondary)
                        Text("No coupons yet")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("Check the Available tab to claim some!")
                            .foregroundColor(.secondary)
                    }
                } else {
                    // List State
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(viewModel.myCoupons) { coupon in
                                CouponCardView(coupon: coupon)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("My Coupons")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        Task {
                            await viewModel.refresh()
                        }
                    } label: {
                        Label("Refresh", systemImage: "arrow.clockwise")
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .alert("Error", isPresented: .constant(viewModel.errorMessage != nil)) {
                Button("OK") {
                    viewModel.errorMessage = nil
                }
            } message: {
                if let errorMessage = viewModel.errorMessage {
                    Text(errorMessage)
                }
            }
            .task {
                await viewModel.fetchMyCoupons()
            }
        }
    }
}

#Preview {
    MyCouponsView()
}
