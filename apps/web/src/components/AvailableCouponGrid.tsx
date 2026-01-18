import type { Coupon } from "@/lib/types";
import { CouponCard } from "@/components/CouponCard";

interface AvailableCouponGridProps {
  coupons: Coupon[];
  onClaim?: (coupon: Coupon) => void;
  isClaiming?: boolean;
}

export const AvailableCouponGrid = ({ coupons, onClaim, isClaiming }: AvailableCouponGridProps) => {
  if (!coupons.length) {
    return (
      <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
        No coupons match your filters right now. Check again after the next MCP refresh.
      </p>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {coupons.map((coupon) => (
        <CouponCard
          key={coupon.id}
          coupon={coupon}
          ctaLabel={onClaim ? "Claim" : undefined}
          onCtaClick={onClaim}
          disabled={isClaiming}
        />
      ))}
    </div>
  );
};
