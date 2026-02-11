import SwiftUI
import MCDCore

public struct AvailableCouponsView: View {
    @StateObject private var viewModel = CouponViewModel()
    @State private var showingClaimSuccess = false
    @State private var claimSuccessMessage = "All available coupons have been claimed!"
    @State private var couponPendingClaim: Coupon?
    @State private var selectedCoupon: Coupon?

    private let gridColumns = [
        GridItem(.adaptive(minimum: 300), spacing: 16)
    ]

    public init() {}

    public var body: some View {
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
                                        .contentShape(Rectangle())
                                        .onTapGesture {
                                            selectedCoupon = coupon
                                        }

                                    Button("Claim") {
                                        couponPendingClaim = coupon
                                    }
                                    .buttonStyle(.borderedProminent)
                                    .controlSize(.large)
                                    .frame(maxWidth: .infinity)
                                    .disabled(viewModel.isLoading)
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
                            let claimSucceeded = await viewModel.autoClaimAll()
                            if claimSucceeded {
                                claimSuccessMessage = "All available coupons have been claimed!"
                                showingClaimSuccess = true
                            }
                        }
                    }
                    .disabled(viewModel.isLoading || viewModel.availableCoupons.isEmpty)
                }
            }
            .confirmationDialog(
                "Claim Coupon",
                isPresented: Binding(
                    get: { couponPendingClaim != nil },
                    set: { newValue in
                        if !newValue {
                            couponPendingClaim = nil
                        }
                    }
                ),
                titleVisibility: .visible,
                presenting: couponPendingClaim
            ) { coupon in
                Button("Claim This Coupon") {
                    couponPendingClaim = nil
                    Task {
                        let claimSucceeded = await viewModel.claimCoupon(coupon)
                        if claimSucceeded {
                            claimSuccessMessage = "Individual claim is not supported by backend yet, so all available coupons were claimed."
                            showingClaimSuccess = true
                        }
                    }
                }
                Button("Cancel", role: .cancel) {
                    couponPendingClaim = nil
                }
            } message: { coupon in
                Text("The backend currently supports only auto-claim. Claiming \"\(coupon.name)\" will claim all available coupons.")
            }
            .alert("Success", isPresented: $showingClaimSuccess) {
                Button("OK") {
                    showingClaimSuccess = false
                }
            } message: {
                Text(claimSuccessMessage)
            }
            .alert("Error", isPresented: Binding(
                get: { viewModel.errorMessage != nil },
                set: { newValue in
                    if !newValue {
                        viewModel.errorMessage = nil
                    }
                }
            )) {
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
            .sheet(item: $selectedCoupon) { coupon in
                CouponDetailView(coupon: coupon)
            }
        }
    }
}

#Preview {
    AvailableCouponsView()
}
