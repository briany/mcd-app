import { render, screen } from "@testing-library/react";
import { vi, beforeEach, afterEach } from "vitest";
import { CampaignList } from "@/components/CampaignList";
import type { Campaign } from "@/lib/types";

describe("CampaignList", () => {
  beforeEach(() => {
    // Mock current date to 2026-01-19 12:00:00 UTC for consistent getStatus results
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-19T12:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const mockCampaigns: Campaign[] = [
    {
      id: "campaign-1",
      title: "Summer Sale",
      description: "Get 50% off on all items",
      startDate: "2026-01-15",
      endDate: "2026-01-25",
      isSubscribed: true,
      imageUrl: null,
    },
    {
      id: "campaign-2",
      title: "Winter Promo",
      description: "Hot drinks at discount prices",
      startDate: "2026-01-20",
      endDate: "2026-01-30",
      isSubscribed: false,
      imageUrl: null,
    },
  ];

  it("renders all campaigns", () => {
    render(<CampaignList campaigns={mockCampaigns} />);
    expect(screen.getByText("Summer Sale")).toBeInTheDocument();
    expect(screen.getByText("Winter Promo")).toBeInTheDocument();
  });

  it("renders campaign descriptions", () => {
    render(<CampaignList campaigns={mockCampaigns} />);
    expect(screen.getByText("Get 50% off on all items")).toBeInTheDocument();
    expect(screen.getByText("Hot drinks at discount prices")).toBeInTheDocument();
  });

  it("renders correct number of campaign cards", () => {
    const { container } = render(<CampaignList campaigns={mockCampaigns} />);
    const articles = container.querySelectorAll("article");
    expect(articles).toHaveLength(2);
  });

  it("shows subscription status for subscribed campaigns", () => {
    render(<CampaignList campaigns={mockCampaigns} />);
    const subscriptionStatuses = screen.getAllByText(/subscribed/i);
    expect(subscriptionStatuses).toHaveLength(2);
    expect(subscriptionStatuses[0].textContent).toBe("Subscribed");
  });

  it("shows subscription status for non-subscribed campaigns", () => {
    render(<CampaignList campaigns={mockCampaigns} />);
    expect(screen.getByText("Not subscribed")).toBeInTheDocument();
  });

  describe("campaign status", () => {
    it("shows ONGOING status for current campaigns", () => {
      const ongoingCampaign: Campaign = {
        id: "ongoing",
        title: "Ongoing Campaign",
        description: "Test",
        startDate: "2026-01-15",
        endDate: "2026-01-25",
        isSubscribed: false,
        imageUrl: null,
      };

      render(<CampaignList campaigns={[ongoingCampaign]} />);
      expect(screen.getByText("ONGOING")).toBeInTheDocument();
    });

    it("shows UPCOMING status for future campaigns", () => {
      const upcomingCampaign: Campaign = {
        id: "upcoming",
        title: "Upcoming Campaign",
        description: "Test",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        isSubscribed: false,
        imageUrl: null,
      };

      render(<CampaignList campaigns={[upcomingCampaign]} />);
      expect(screen.getByText("UPCOMING")).toBeInTheDocument();
    });

    it("shows PAST status for ended campaigns", () => {
      const pastCampaign: Campaign = {
        id: "past",
        title: "Past Campaign",
        description: "Test",
        startDate: "2025-12-01",
        endDate: "2025-12-15",
        isSubscribed: false,
        imageUrl: null,
      };

      render(<CampaignList campaigns={[pastCampaign]} />);
      expect(screen.getByText("PAST")).toBeInTheDocument();
    });

    it("shows UNKNOWN status for invalid date campaigns", () => {
      const invalidCampaign: Campaign = {
        id: "invalid",
        title: "Invalid Campaign",
        description: "Test",
        startDate: "invalid-date",
        endDate: "also-invalid",
        isSubscribed: false,
        imageUrl: null,
      };

      render(<CampaignList campaigns={[invalidCampaign]} />);
      expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
    });
  });

  describe("date formatting", () => {
    it("formats dates correctly", () => {
      render(<CampaignList campaigns={[mockCampaigns[0]]} />);
      // Should show formatted dates like "Jan 15 – Jan 25"
      expect(screen.getByText(/Jan 15/)).toBeInTheDocument();
      expect(screen.getByText(/Jan 25/)).toBeInTheDocument();
    });
  });

  describe("empty campaigns list", () => {
    it("renders empty container when no campaigns", () => {
      const { container } = render(<CampaignList campaigns={[]} />);
      const spaceDiv = container.querySelector("div");
      expect(spaceDiv).toBeInTheDocument();
      expect(container.querySelectorAll("article")).toHaveLength(0);
    });
  });

  describe("single campaign", () => {
    it("renders single campaign correctly", () => {
      render(<CampaignList campaigns={[mockCampaigns[0]]} />);
      expect(screen.getByText("Summer Sale")).toBeInTheDocument();
      expect(screen.queryByText("Winter Promo")).not.toBeInTheDocument();
    });
  });

  describe("status badge styling", () => {
    it("applies correct styling for ongoing campaigns", () => {
      const ongoingCampaign: Campaign = {
        id: "ongoing",
        title: "Test",
        description: "Test",
        startDate: "2026-01-15",
        endDate: "2026-01-25",
        isSubscribed: false,
        imageUrl: null,
      };

      const { container } = render(<CampaignList campaigns={[ongoingCampaign]} />);
      const badge = screen.getByText("ONGOING");
      expect(badge.className).toContain("bg-emerald-100");
      expect(badge.className).toContain("text-emerald-700");
    });

    it("applies correct styling for upcoming campaigns", () => {
      const upcomingCampaign: Campaign = {
        id: "upcoming",
        title: "Test",
        description: "Test",
        startDate: "2026-02-01",
        endDate: "2026-02-15",
        isSubscribed: false,
        imageUrl: null,
      };

      const { container } = render(<CampaignList campaigns={[upcomingCampaign]} />);
      const badge = screen.getByText("UPCOMING");
      expect(badge.className).toContain("bg-sky-100");
      expect(badge.className).toContain("text-sky-700");
    });
  });
});
