"use client";

import Link from "next/link";

import { AvailableCouponGrid } from "@/components/AvailableCouponGrid";
import { CampaignList } from "@/components/CampaignList";
import { CouponCard } from "@/components/CouponCard";
import { StatusBanner } from "@/components/StatusBanner";
import { useAvailableCoupons } from "@/hooks/useAvailableCoupons";
import { useCampaigns } from "@/hooks/useCampaigns";
import { useCoupons } from "@/hooks/useCoupons";

const formatCount = (count: number, loading: boolean) =>
  loading ? "…" : new Intl.NumberFormat().format(count);

export default function DashboardPage() {
  const {
    data: myCoupons,
    isLoading: couponsLoading,
    error: couponsError,
    claimCoupon,
    isClaiming,
  } = useCoupons();
  const {
    data: availableCoupons,
    isLoading: availableLoading,
    error: availableError,
    autoClaim,
    isAutoClaiming,
  } = useAvailableCoupons();
  const {
    data: campaigns,
    isLoading: campaignsLoading,
    error: campaignsError,
  } = useCampaigns();

  const summaryCards = [
    {
      label: "My Coupons",
      count: myCoupons?.coupons.length ?? 0,
      href: "/coupons",
      description: "Issued and ready to redeem",
      loading: couponsLoading,
    },
    {
      label: "Available",
      count: availableCoupons?.coupons.length ?? 0,
      href: "/available",
      description: "Eligible for automated claims",
      loading: availableLoading,
    },
    {
      label: "Campaigns",
      count: campaigns?.campaigns.length ?? 0,
      href: "/campaigns",
      description: "Live marketing pushes",
      loading: campaignsLoading,
    },
  ];

  return (
    <div className="space-y-8">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-amber-500">MCP Overview</p>
        <h1 className="text-3xl font-semibold text-slate-900">Mission Control</h1>
        <p className="text-sm text-slate-500">
          Stay in sync with the native apps—see coupons, campaigns, and actions at a glance.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        {summaryCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            <p className="text-sm text-slate-500">{card.description}</p>
            <p className="text-3xl font-semibold text-slate-900">
              {formatCount(card.count, card.loading)}
            </p>
            <p className="text-sm font-semibold text-amber-600">{card.label} →</p>
          </Link>
        ))}
      </section>

      {couponsError ? (
        <StatusBanner tone="error" title="Coupon feed failed" message={couponsError.message} />
      ) : null}
      {availableError ? (
        <StatusBanner tone="warning" title="Available coupons stalled" message={availableError.message} />
      ) : null}
      {campaignsError ? (
        <StatusBanner tone="warning" title="Campaigns unavailable" message={campaignsError.message} />
      ) : null}

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">My Coupons</h2>
            <Link href="/coupons" className="text-sm font-semibold text-amber-600">
              Manage all
            </Link>
          </div>
          {couponsLoading ? (
            <p className="text-sm text-slate-500">Loading coupons…</p>
          ) : (
            <div className="space-y-3">
              {myCoupons?.coupons.slice(0, 3).map((coupon) => (
                <CouponCard
                  key={coupon.id}
                  coupon={coupon}
                  ctaLabel="Mark as used"
                  onCtaClick={(selected) => claimCoupon(selected.id)}
                  disabled={isClaiming}
                />
              )) || (
                <p className="text-sm text-slate-500">No coupons yet.</p>
              )}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Available Coupons</h2>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => autoClaim()}
                disabled={isAutoClaiming}
                className="rounded-full bg-emerald-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-200"
              >
                {isAutoClaiming ? "Claiming…" : "Auto claim"}
              </button>
              <Link href="/available" className="text-sm font-semibold text-amber-600">
                View all
              </Link>
            </div>
          </div>
          {availableLoading ? (
            <p className="text-sm text-slate-500">Loading available coupons…</p>
          ) : (
            <AvailableCouponGrid
              coupons={availableCoupons?.coupons.slice(0, 4) ?? []}
              onClaim={(coupon) => claimCoupon(coupon.id)}
              isClaiming={isClaiming || isAutoClaiming}
            />
          )}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Campaign Radar</h2>
          <Link href="/campaigns" className="text-sm font-semibold text-amber-600">
            Browse calendar
          </Link>
        </div>
        {campaignsLoading ? (
          <p className="text-sm text-slate-500">Loading campaigns…</p>
        ) : (
          <CampaignList campaigns={campaigns?.campaigns.slice(0, 2) ?? []} />
        )}
      </section>
    </div>
  );
}
