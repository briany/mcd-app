"use client";

import { useMemo, useState } from "react";

import { AvailableCouponGrid } from "@/components/AvailableCouponGrid";
import { StatusBanner } from "@/components/StatusBanner";
import { useAvailableCoupons } from "@/hooks/useAvailableCoupons";

export default function AvailableCouponsPage() {
  const { data, isLoading, error, autoClaim, isAutoClaiming, claimCoupon, isClaiming } =
    useAvailableCoupons();
  const [query, setQuery] = useState("");

  const filteredCoupons = useMemo(() => {
    if (!data?.coupons) return [];
    const normalized = query.trim().toLowerCase();
    if (!normalized) return data.coupons;
    return data.coupons.filter((coupon) =>
      [coupon.name, coupon.status].some((value) => value.toLowerCase().includes(normalized))
    );
  }, [data, query]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-amber-500">Available Coupons</p>
        <h1 className="text-3xl font-semibold text-slate-900">Claim queue</h1>
        <p className="text-sm text-slate-500">
          Matches the macOS &quot;Available Coupons&quot; tab. Trigger auto-claim or grab individual coupons.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search promotions"
          className="flex-1 min-w-[200px] rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 focus:border-amber-400 focus:outline-none"
        />
        <button
          type="button"
          onClick={() => autoClaim()}
          disabled={isAutoClaiming}
          className="rounded-full bg-amber-500 px-6 py-2 text-sm font-semibold text-white transition hover:bg-amber-400 disabled:cursor-not-allowed disabled:bg-amber-200"
        >
          {isAutoClaiming ? "Running auto-claim…" : "Auto-claim all"}
        </button>
      </div>

      {error ? (
        <StatusBanner tone="error" title="Unable to load available coupons" message={error.message} />
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading available coupons…</p>
      ) : (
        <AvailableCouponGrid
          coupons={filteredCoupons}
          onClaim={(coupon) => claimCoupon(coupon.id)}
          isClaiming={isClaiming || isAutoClaiming}
        />
      )}
    </div>
  );
}
