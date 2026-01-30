import Image from "next/image";

import type { Coupon } from "@/lib/types";
import { cn } from "@/lib/utils";
import { statusColor, humanizeExpiry } from "@/lib/couponUtils";

interface CouponCardProps {
  coupon: Coupon;
  ctaLabel?: string;
  onCtaClick?: (coupon: Coupon) => void;
  onCardClick?: (coupon: Coupon) => void;
  disabled?: boolean;
}

export const CouponCard = ({
  coupon,
  ctaLabel,
  onCtaClick,
  onCardClick,
  disabled,
}: CouponCardProps) => (
  <article
    onClick={() => onCardClick?.(coupon)}
    className={cn(
      "flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all",
      onCardClick && "cursor-pointer hover:border-amber-300 hover:shadow-md active:scale-[0.98]"
    )}
  >
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="text-lg font-semibold text-slate-900">{coupon.name}</p>
        <p className={cn("text-sm font-medium", statusColor(coupon.status))}>{coupon.status}</p>
      </div>
      {coupon.imageUrl ? (
        <Image
          src={coupon.imageUrl}
          alt={coupon.name}
          width={64}
          height={64}
          className="h-16 w-16 rounded-xl object-cover"
        />
      ) : null}
    </div>
    <p className="text-sm text-slate-500">{humanizeExpiry(coupon.expiryDate)}</p>
    {ctaLabel ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation(); // Prevent card click when clicking CTA
          onCtaClick?.(coupon);
        }}
        disabled={disabled}
        className={cn(
          "rounded-full px-4 py-2 text-sm font-semibold transition",
          disabled
            ? "cursor-not-allowed bg-slate-200 text-slate-500"
            : "bg-amber-400 text-slate-950 hover:bg-amber-300"
        )}
      >
        {ctaLabel}
      </button>
    ) : null}
  </article>
);
