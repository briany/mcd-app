import { fireEvent, render, screen } from "@testing-library/react";

import { CouponDetailModal } from "@/components/CouponDetailModal";
import type { Coupon } from "@/lib/types";

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

const mockCoupon: Coupon = {
  id: "abc",
  name: "Free Fries",
  expiryDate: "2099-12-31",
  status: "active",
  imageUrl: null,
  rawMarkdown: "## Free Fries\n\n**Details**: Get a free medium fries with any purchase.",
};

describe("CouponDetailModal", () => {
  it("renders nothing when coupon is null", () => {
    const { container } = render(
      <CouponDetailModal coupon={null} isOpen={false} onClose={vi.fn()} />
    );
    expect(container.firstChild).toBeNull();
  });

  it("shows modal when isOpen is true", () => {
    render(<CouponDetailModal coupon={mockCoupon} isOpen={true} onClose={vi.fn()} />);

    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    // "Free Fries" appears twice - in header and markdown - use getAllByText
    expect(screen.getAllByText("Free Fries").length).toBeGreaterThanOrEqual(1);
  });

  it("renders markdown content", () => {
    render(<CouponDetailModal coupon={mockCoupon} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText(/Get a free medium fries/)).toBeInTheDocument();
  });

  it("calls onClose when header close button is clicked", () => {
    const onClose = vi.fn();
    render(<CouponDetailModal coupon={mockCoupon} isOpen={true} onClose={onClose} />);

    // Find all close buttons - first is the X button in header
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    fireEvent.click(closeButtons[0]); // Header X button
    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose when footer close button is clicked", () => {
    const onClose = vi.fn();
    render(<CouponDetailModal coupon={mockCoupon} isOpen={true} onClose={onClose} />);

    // Find all close buttons - last is the footer button
    const closeButtons = screen.getAllByRole("button", { name: "Close" });
    fireEvent.click(closeButtons[closeButtons.length - 1]); // Footer button is last
    expect(onClose).toHaveBeenCalled();
  });

  it("shows fallback message when no rawMarkdown", () => {
    const couponWithoutMarkdown = { ...mockCoupon, rawMarkdown: undefined };
    render(<CouponDetailModal coupon={couponWithoutMarkdown} isOpen={true} onClose={vi.fn()} />);

    expect(screen.getByText("No additional details available.")).toBeInTheDocument();
  });
});
