import XCTest
import SwiftUI
@testable import MCDSharedUI
@testable import MCDCore

final class CampaignCardViewTests: XCTestCase {

    func testCampaignCardViewInitialization() {
        let campaign = Campaign(
            id: "camp-1",
            title: "Spring Festival 2026",
            description: "Special discounts for Spring Festival",
            imageUrl: "https://example.com/campaign.jpg",
            startDate: "2026-03-01",
            endDate: "2026-03-31",
            isSubscribed: true
        )

        let view = CampaignCardView(campaign: campaign)

        XCTAssertNotNil(view)
        XCTAssertEqual(view.campaign.id, "camp-1")
        XCTAssertEqual(view.campaign.title, "Spring Festival 2026")
        XCTAssertTrue(view.campaign.isSubscribed)
    }

    func testCampaignCardViewWithoutSubscription() {
        let campaign = Campaign(
            id: "camp-2",
            title: "Summer Sale",
            description: "Hot summer deals",
            imageUrl: nil,
            startDate: "2026-06-01",
            endDate: "2026-08-31",
            isSubscribed: false
        )

        let view = CampaignCardView(campaign: campaign)

        XCTAssertNotNil(view)
        XCTAssertFalse(view.campaign.isSubscribed)
        XCTAssertNil(view.campaign.imageUrl)
    }

    func testCampaignStatusBadges() {
        // Test ongoing campaign
        let ongoingCampaign = Campaign(
            id: "ongoing",
            title: "Current Campaign",
            description: "Running now",
            imageUrl: nil,
            startDate: "2026-01-01",
            endDate: "2026-12-31",
            isSubscribed: false
        )

        XCTAssertEqual(ongoingCampaign.status, .ongoing)

        // Test upcoming campaign
        let upcomingCampaign = Campaign(
            id: "upcoming",
            title: "Future Campaign",
            description: "Coming soon",
            imageUrl: nil,
            startDate: "2027-01-01",
            endDate: "2027-12-31",
            isSubscribed: false
        )

        XCTAssertEqual(upcomingCampaign.status, .upcoming)

        // Test past campaign
        let pastCampaign = Campaign(
            id: "past",
            title: "Old Campaign",
            description: "Already ended",
            imageUrl: nil,
            startDate: "2025-01-01",
            endDate: "2025-12-31",
            isSubscribed: false
        )

        XCTAssertEqual(pastCampaign.status, .past)
    }
}
