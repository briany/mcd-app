import Foundation
import SwiftUI

@MainActor
class CouponViewModel: ObservableObject {
    @Published var myCoupons: [Coupon] = []
    @Published var availableCoupons: [Coupon] = []
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let client = MCPClient.shared

    // MARK: - Public Methods

    func fetchMyCoupons() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await client.fetchMyCoupons()
            myCoupons = response.coupons
        } catch let error as MCPError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
        }

        isLoading = false
    }

    func fetchAvailableCoupons() async {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await client.fetchAvailableCoupons()
            availableCoupons = response.coupons
        } catch let error as MCPError {
            errorMessage = error.errorDescription
        } catch {
            errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
        }

        isLoading = false
    }

    func autoClaimAll() async {
        isLoading = true
        errorMessage = nil

        do {
            _ = try await client.autoClaimCoupons()
            // After claiming, refresh both lists
            await fetchMyCoupons()
            await fetchAvailableCoupons()
        } catch let error as MCPError {
            errorMessage = error.errorDescription
            isLoading = false
        } catch {
            errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
            isLoading = false
        }
    }

    func refresh() async {
        await client.clearCache()
        await fetchMyCoupons()
    }
}
