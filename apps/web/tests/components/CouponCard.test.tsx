import { fireEvent, render, screen } from "@testing-library/react";

import { CouponCard } from "@/components/CouponCard";
import type { Coupon } from "@/lib/types";

const mockCoupon: Coupon = {
  id: "abc",
  name: "Free Fries",
  expiryDate: "2099-12-31",
  status: "Active",
  imageUrl: null,
};

describe("CouponCard", () => {
  it("renders coupon details", () => {
    render(<CouponCard coupon={mockCoupon} ctaLabel="Claim" />);

    expect(screen.getByText("Free Fries")).toBeInTheDocument();
    expect(screen.getByText("Active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Claim" })).toBeInTheDocument();
  });

  it("invokes CTA callback", () => {
    const onCtaClick = vi.fn();
    render(<CouponCard coupon={mockCoupon} ctaLabel="Claim" onCtaClick={onCtaClick} />);

    fireEvent.click(screen.getByRole("button", { name: "Claim" }));
    expect(onCtaClick).toHaveBeenCalledWith(mockCoupon);
  });
});
