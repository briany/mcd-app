import Foundation
import SwiftUI

@MainActor
public class CouponViewModel: ObservableObject {
    @Published public var myCoupons: [Coupon] = []
    @Published public var availableCoupons: [Coupon] = []
    @Published public var isLoading = false
    @Published public var errorMessage: String?

    private let client = MCPClient.shared

    public init() {}

    // MARK: - Public Methods

    public func fetchMyCoupons() async {
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

    public func fetchAvailableCoupons() async {
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

    @discardableResult
    public func autoClaimAll() async -> Bool {
        isLoading = true
        errorMessage = nil

        do {
            let response = try await client.autoClaimCoupons()
            guard response.success else {
                errorMessage = response.message
                isLoading = false
                return false
            }

            // After claiming, refresh both lists
            await fetchMyCoupons()
            await fetchAvailableCoupons()
            return true
        } catch let error as MCPError {
            errorMessage = error.errorDescription
            isLoading = false
            return false
        } catch {
            errorMessage = "An unexpected error occurred: \(error.localizedDescription)"
            isLoading = false
            return false
        }
    }

    public func refresh() async {
        await client.clearCache()
        await fetchMyCoupons()
    }
}
