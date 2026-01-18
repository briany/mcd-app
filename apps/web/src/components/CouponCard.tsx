import Image from "next/image";

import type { Coupon } from "@/lib/types";
import { cn } from "@/lib/utils";

interface CouponCardProps {
  coupon: Coupon;
  ctaLabel?: string;
  onCtaClick?: (coupon: Coupon) => void;
  disabled?: boolean;
}

const statusColor = (status: string) => {
  const normalized = status.toLowerCase();
  if (normalized.includes("expire")) return "text-rose-600";
  if (normalized.includes("active")) return "text-emerald-600";
  return "text-slate-500";
};

const humanizeExpiry = (expiryDate: string) => {
  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return "Unknown expiry";
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
  if (days < 0) return `Expired ${Math.abs(days)}d ago`;
  if (days === 0) return "Expires today";
  return `Expires in ${days}d`;
};

export const CouponCard = ({ coupon, ctaLabel, onCtaClick, disabled }: CouponCardProps) => (
  <article className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
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
        onClick={() => onCtaClick?.(coupon)}
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
