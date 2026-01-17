import SwiftUI

struct AvailableCouponsView: View {
    @StateObject private var viewModel = CouponViewModel()
    @State private var showingClaimSuccess = false

    private let gridColumns = [
        GridItem(.adaptive(minimum: 300), spacing: 16)
    ]

    var body: some View {
        NavigationStack {
            ZStack {
                if viewModel.isLoading {
                    // Loading State
                    VStack {
                        ProgressView()
                        Text("Loading available coupons...")
                            .foregroundColor(.secondary)
                            .padding(.top, 8)
                    }
                } else if viewModel.availableCoupons.isEmpty {
                    // Empty State
                    VStack(spacing: 16) {
                        Image(systemName: "checkmark.circle.fill")
                            .font(.system(size: 60))
                            .foregroundColor(.green)
                        Text("All caught up!")
                            .font(.title2)
                            .fontWeight(.semibold)
                        Text("No new coupons available to claim")
                            .foregroundColor(.secondary)
                    }
                } else {
                    // Grid State
                    ScrollView {
                        LazyVGrid(columns: gridColumns, spacing: 16) {
                            ForEach(viewModel.availableCoupons) { coupon in
                                VStack(spacing: 12) {
                                    CouponCardView(coupon: coupon)

                                    // Individual Claim Button (placeholder)
                                    Button("Claim") {
                                        // TODO: Implement individual claim functionality
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .controlSize(.large)
                                    .frame(maxWidth: .infinity)
                                }
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Available Coupons")
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Claim All") {
                        Task {
                            await viewModel.autoClaimAll()
                            showingClaimSuccess = true
                        }
                    }
                    .disabled(viewModel.isLoading || viewModel.availableCoupons.isEmpty)
                }
            }
            .alert("Success", isPresented: $showingClaimSuccess) {
                Button("OK") {
                    showingClaimSuccess = false
                }
            } message: {
                Text("All available coupons have been claimed!")
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
                await viewModel.fetchAvailableCoupons()
            }
        }
    }
}

#Preview {
    AvailableCouponsView()
}
