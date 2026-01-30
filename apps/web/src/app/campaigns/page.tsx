"use client";

import { useState } from "react";

import { CampaignDetailModal } from "@/components/CampaignDetailModal";
import { CampaignList } from "@/components/CampaignList";
import { StatusBanner } from "@/components/StatusBanner";
import { useCampaigns } from "@/hooks/useCampaigns";
import type { Campaign } from "@/lib/types";

export default function CampaignsPage() {
  const [date, setDate] = useState<string | undefined>(undefined);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const { data, isLoading, error } = useCampaigns({ date });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-wide text-amber-500">Campaigns</p>
        <h1 className="text-3xl font-semibold text-slate-900">Marketing calendar</h1>
        <p className="text-sm text-slate-500">
          This mirrors the CampaignCalendarView from SwiftUI; filter by ISO date to drill into MCP data.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="text-sm font-semibold text-slate-600">
          Target date
          <input
            type="date"
            value={date ?? ""}
            onChange={(event) => setDate(event.target.value || undefined)}
            className="mt-1 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-base text-slate-900 focus:border-amber-400 focus:outline-none"
          />
        </label>
        {date ? (
          <button
            type="button"
            onClick={() => setDate(undefined)}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-amber-400 hover:text-amber-600"
          >
            Clear filter
          </button>
        ) : null}
      </div>

      {error ? (
        <StatusBanner tone="error" title="Unable to load campaigns" message={error.message} />
      ) : null}

      {isLoading ? (
        <p className="text-sm text-slate-500">Loading campaigns…</p>
      ) : (
        <CampaignList campaigns={data?.campaigns ?? []} onCampaignClick={setSelectedCampaign} />
      )}

      <CampaignDetailModal
        campaign={selectedCampaign}
        isOpen={selectedCampaign !== null}
        onClose={() => setSelectedCampaign(null)}
      />
    </div>
  );
}
