import { render, screen } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { AvailableCouponGrid } from "@/components/AvailableCouponGrid";
import type { Coupon } from "@/lib/types";

const mockCoupons: Coupon[] = [
  {
    id: "coupon-1",
    name: "Free Coffee",
    expiryDate: "2099-01-01",
    status: "active",
    imageUrl: null,
  },
  {
    id: "coupon-2",
    name: "Buy One Get One",
    expiryDate: "2099-12-31",
    status: "active",
    imageUrl: "https://example.com/image.jpg",
  },
];

describe("AvailableCouponGrid", () => {
  describe("empty state", () => {
    it("shows empty message when no coupons provided", () => {
      render(<AvailableCouponGrid coupons={[]} />);
      expect(screen.getByText(/No coupons match your filters/i)).toBeInTheDocument();
    });

    it("applies correct styling to empty state", () => {
      const { container } = render(<AvailableCouponGrid coupons={[]} />);
      const emptyElement = container.querySelector("p");
      expect(emptyElement?.className).toContain("border-dashed");
      expect(emptyElement?.className).toContain("text-center");
    });
  });

  describe("grid rendering", () => {
    it("renders all coupons in a grid", () => {
      render(<AvailableCouponGrid coupons={mockCoupons} />);
      expect(screen.getByText("Free Coffee")).toBeInTheDocument();
      expect(screen.getByText("Buy One Get One")).toBeInTheDocument();
    });

    it("applies grid layout classes", () => {
      const { container } = render(<AvailableCouponGrid coupons={mockCoupons} />);
      const gridElement = container.querySelector("div");
      expect(gridElement?.className).toContain("grid");
      expect(gridElement?.className).toContain("gap-4");
    });

    it("renders correct number of coupon cards", () => {
      const { container } = render(<AvailableCouponGrid coupons={mockCoupons} />);
      const articles = container.querySelectorAll("article");
      expect(articles).toHaveLength(2);
    });
  });

  describe("claim functionality", () => {
    it("shows claim button when onClaim is provided", () => {
      const onClaim = vi.fn();
      render(<AvailableCouponGrid coupons={mockCoupons} onClaim={onClaim} />);

      const claimButtons = screen.getAllByRole("button", { name: "Claim" });
      expect(claimButtons).toHaveLength(2);
    });

    it("does not show claim button when onClaim is not provided", () => {
      render(<AvailableCouponGrid coupons={mockCoupons} />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });

    it("calls onClaim with correct coupon when clicked", async () => {
      const user = userEvent.setup();
      const onClaim = vi.fn();
      render(<AvailableCouponGrid coupons={mockCoupons} onClaim={onClaim} />);

      const claimButtons = screen.getAllByRole("button", { name: "Claim" });
      await user.click(claimButtons[0]);

      expect(onClaim).toHaveBeenCalledTimes(1);
      expect(onClaim).toHaveBeenCalledWith(mockCoupons[0]);
    });

    it("disables buttons when isClaiming is true", () => {
      const onClaim = vi.fn();
      render(<AvailableCouponGrid coupons={mockCoupons} onClaim={onClaim} isClaiming={true} />);

      const claimButtons = screen.getAllByRole("button", { name: "Claim" });
      claimButtons.forEach((button) => {
        expect(button).toBeDisabled();
      });
    });

    it("enables buttons when isClaiming is false", () => {
      const onClaim = vi.fn();
      render(<AvailableCouponGrid coupons={mockCoupons} onClaim={onClaim} isClaiming={false} />);

      const claimButtons = screen.getAllByRole("button", { name: "Claim" });
      claimButtons.forEach((button) => {
        expect(button).not.toBeDisabled();
      });
    });
  });

  describe("single coupon", () => {
    it("renders single coupon correctly", () => {
      render(<AvailableCouponGrid coupons={[mockCoupons[0]]} />);
      expect(screen.getByText("Free Coffee")).toBeInTheDocument();
    });
  });

  describe("many coupons", () => {
    it("renders many coupons in grid", () => {
      const manyCoupons: Coupon[] = Array.from({ length: 10 }, (_, i) => ({
        id: `coupon-${i}`,
        name: `Coupon ${i}`,
        expiryDate: "2099-01-01",
        status: "active",
        imageUrl: null,
      }));

      render(<AvailableCouponGrid coupons={manyCoupons} />);

      expect(screen.getByText("Coupon 0")).toBeInTheDocument();
      expect(screen.getByText("Coupon 9")).toBeInTheDocument();
    });
  });
});
