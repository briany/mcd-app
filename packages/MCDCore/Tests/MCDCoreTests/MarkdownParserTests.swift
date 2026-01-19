import XCTest
@testable import MCDCore

final class MarkdownParserTests: XCTestCase {

    // MARK: - My Coupons Parsing

    func testParseMyCouponsEmpty() {
        let input = ""
        let coupons = MarkdownParser.parseMyCoupons(input)
        XCTAssertTrue(coupons.isEmpty)
    }

    func testParseMyCouponsSingleCoupon() {
        let input = """
        # My Coupons
        ## Big Mac Combo
        <img src="https://example.com/bigmac.jpg"/>
        - **有效期**: 2026-01-19 00:00-2026-01-20 23:59
        - **状态**: Active
        """
        let coupons = MarkdownParser.parseMyCoupons(input)

        XCTAssertEqual(coupons.count, 1)
        XCTAssertEqual(coupons[0].name, "Big Mac Combo")
        XCTAssertEqual(coupons[0].imageUrl, "https://example.com/bigmac.jpg")
        XCTAssertEqual(coupons[0].expiryDate, "2026-01-20")
    }

    func testParseMyCouponsMultipleCoupons() {
        let input = """
        # My Coupons
        ## Big Mac Combo
        - **有效期**: 2026-01-19 00:00-2026-01-25 23:59

        ## McFlurry
        - **有效期**: 2026-02-01 00:00-2026-02-28 23:59

        ## Fries
        - **有效期**: 2026-03-01 00:00-2026-03-31 23:59
        """
        let coupons = MarkdownParser.parseMyCoupons(input)

        XCTAssertEqual(coupons.count, 3)
        XCTAssertEqual(coupons[0].name, "Big Mac Combo")
        XCTAssertEqual(coupons[1].name, "McFlurry")
        XCTAssertEqual(coupons[2].name, "Fries")
    }

    // MARK: - Available Coupons Parsing

    func testParseAvailableCouponsEmpty() {
        let input = ""
        let coupons = MarkdownParser.parseAvailableCoupons(input)
        XCTAssertTrue(coupons.isEmpty)
    }

    func testParseAvailableCouponsSingle() {
        let input = """
        # Available Coupons
        - 优惠券标题：McChicken Sandwich\\
        <img src="https://example.com/chicken.jpg"/>\\
        状态：未领取
        """
        let coupons = MarkdownParser.parseAvailableCoupons(input)

        XCTAssertEqual(coupons.count, 1)
        XCTAssertEqual(coupons[0].name, "McChicken Sandwich")
        XCTAssertEqual(coupons[0].status, "available")
    }

    func testParseAvailableCouponsWithClaimedStatus() {
        let input = """
        # Available Coupons
        - 优惠券标题：Already Claimed\\
        状态：已领取
        """
        let coupons = MarkdownParser.parseAvailableCoupons(input)

        XCTAssertEqual(coupons.count, 1)
        XCTAssertEqual(coupons[0].status, "claimed")
    }

    // MARK: - Campaign Parsing

    func testParseCampaignsEmpty() {
        let input = ""
        let campaigns = MarkdownParser.parseCampaigns(input, for: "2026-01-19")
        XCTAssertTrue(campaigns.isEmpty)
    }

    func testParseCampaignsSingle() {
        let input = """
        # Campaigns
        -   **活动标题**：Spring Festival 2026\\
        **活动内容介绍**：Special discounts for Spring Festival\\
        <img src="https://example.com/spring.jpg"/>
        """
        let campaigns = MarkdownParser.parseCampaigns(input, for: "2026-03-01")

        XCTAssertEqual(campaigns.count, 1)
        XCTAssertEqual(campaigns[0].title, "Spring Festival 2026")
        XCTAssertEqual(campaigns[0].description, "Special discounts for Spring Festival")
        XCTAssertEqual(campaigns[0].startDate, "2026-03-01")
        XCTAssertEqual(campaigns[0].endDate, "2026-03-01")
    }

    func testParseCampaignsMultiple() {
        let input = """
        # Campaigns
        -   **活动标题**：Summer Sale\\
        **活动内容介绍**：Hot summer deals\\

        -   **活动标题**：Winter Specials\\
        **活动内容介绍**：Warm winter offers\\
        """
        let campaigns = MarkdownParser.parseCampaigns(input, for: "2026-06-01")

        XCTAssertEqual(campaigns.count, 2)
        XCTAssertEqual(campaigns[0].title, "Summer Sale")
        XCTAssertEqual(campaigns[1].title, "Winter Specials")
    }
}
