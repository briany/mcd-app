"use client";

import { useMemo, useState } from "react";

import { CouponCard } from "@/components/CouponCard";
import { CouponDetailModal } from "@/components/CouponDetailModal";
import { StatusBanner } from "@/components/StatusBanner";
import { useCoupons } from "@/hooks/useCoupons";
import { matchesFilter } from "@/lib/filters";
import type { Coupon } from "@/lib/types";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "expired", label: "Expired" },
];

export default function CouponsPage() {
  const { data, isLoading, error, claimCoupon, isClaiming } = useCoupons();
  const [status, setStatus] = useState("all");
  const [query, setQuery] = useState("");
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);

  const filteredCoupons = useMemo(() => {
    if (!data?.coupons) return [];
    return data.coupons.filter((coupon) => matchesFilter(coupon, status, query));
  }, [data, status, query]);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-amber-500">My Coupons</p>
        <h1 className="text-3xl font-semibold text-slate-900">Redeemables</h1>
        <p className="text-sm text-slate-500">
          This mirrors the SwiftUI My Coupons view. Filter by status or name before claiming.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-600">
          Search by name or status
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try 'Breakfast'"
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 focus:border-amber-400 focus:outline-none"
          />
        </label>
        <label className="text-sm font-semibold text-slate-600">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="mt-1 w-full rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 focus:border-amber-400 focus:outline-none"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? (
        <StatusBanner tone="error" title="Unable to load coupons" message={error.message} />
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading coupons…</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredCoupons.length ? (
            filteredCoupons.map((coupon) => (
              <CouponCard
                key={coupon.id}
                coupon={coupon}
                ctaLabel="Mark as used"
                onCtaClick={(selected) => claimCoupon(selected.id)}
                onCardClick={(selected) => setSelectedCoupon(selected)}
                disabled={isClaiming}
              />
            ))
          ) : (
            <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
              No coupons match this filter.
            </p>
          )}
        </div>
      )}

      <CouponDetailModal
        coupon={selectedCoupon}
        isOpen={selectedCoupon !== null}
        onClose={() => setSelectedCoupon(null)}
      />
    </div>
  );
}
