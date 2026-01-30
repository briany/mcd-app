import { fireEvent, render, screen } from "@testing-library/react";

import { CampaignDetailModal } from "@/components/CampaignDetailModal";
import type { Campaign } from "@/lib/types";

// Mock HTMLDialogElement methods
beforeAll(() => {
  HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
    this.open = true;
  });
  HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
    this.open = false;
    this.dispatchEvent(new Event("close"));
  });
});

const mockCampaign: Campaign = {
  id: "campaign-1",
  title: "Spring Festival 2026",
  description: "Enjoy special discounts during Spring Festival!",
  startDate: "2026-03-01",
  endDate: "2026-03-31",
  imageUrl: null,
  isSubscribed: false,
  rawMarkdown: "## Spring Festival 2026\n\n**Details**: Special discounts available!",
};

describe("CampaignDetailModal", () => {
  it("renders nothing when campaign is null", () => {
    const { container } = render(
      <CampaignDetailModal campaign={null} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows modal when isOpen is true", () => {
    render(<CampaignDetailModal campaign={mockCampaign} isOpen={true} onClose={vi.fn()} />);

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // "Spring Festival 2026" appears twice - in header and markdown - use getAllByText
    expect(screen.getAllByText("Spring Festival 2026").length).toBeGreaterThanOrEqual(1);
  });

  it("renders markdown content", () => {
    render(<CampaignDetailModal campaign={mockCampaign} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Special discounts available/)).toBeInTheDocument();
  });

  it("renders date range", () => {
    render(<CampaignDetailModal campaign={mockCampaign} isOpen={true} onClose={vi.fn()} />);

    // formatDate outputs "Mar 1" (short format without year)
    expect(screen.getByText(/Mar 1.*Mar 31/)).toBeInTheDocument();
  });

  it("calls onClose when header close button is clicked", () => {
    const onClose = vi.fn();
    render(<CampaignDetailModal campaign={mockCampaign} isOpen={true} onClose={onClose} />);

    // Find all close buttons - first is the X button in header
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    fireEvent.click(closeButtons[0]); // Header X button
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when footer close button is clicked", () => {
    const onClose = vi.fn();
    render(<CampaignDetailModal campaign={mockCampaign} isOpen={true} onClose={onClose} />);

    // Find all close buttons - last is the footer button
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    fireEvent.click(closeButtons[closeButtons.length - 1]); // Footer button is last
    expect(onClose).toHaveBeenCalled();
  });

  it("shows fallback message when no rawMarkdown", () => {
    const campaignWithoutMarkdown = { ...mockCampaign, rawMarkdown: undefined };
    render(<CampaignDetailModal campaign={campaignWithoutMarkdown} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("No additional details available.")).toBeInTheDocument();
  });

  it("shows status badge", () => {
    render(<CampaignDetailModal campaign={mockCampaign} isOpen={true} onClose={vi.fn()} />);

    // The campaign is upcoming (starts in future)
    expect(screen.getByText("UPCOMING")).toBeInTheDocument();
  });
});
