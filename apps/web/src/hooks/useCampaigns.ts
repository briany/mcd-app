"use client";

import { useQuery } from "@tanstack/react-query";
import type { CampaignListResponse } from "@/lib/types";
import { handleFetchError } from "@/lib/fetchUtils";

export interface UseCampaignsOptions {
  date?: string; // yyyy-MM-dd filter
}

async function fetchCampaigns(date?: string): Promise<CampaignListResponse> {
  const url = date ? `/api/campaigns?date=${date}` : "/api/campaigns";
  const response = await fetch(url);

  if (!response.ok) {
    await handleFetchError(response, "Failed to load campaigns");
  }

  return response.json();
}

export function useCampaigns(options: UseCampaignsOptions = {}) {
  return useQuery({
    queryKey: ["campaigns", options.date ?? "all"],
    queryFn: () => fetchCampaigns(options.date),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
}
