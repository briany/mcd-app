"use client";

import { useQuery } from "@tanstack/react-query";
import type { CampaignListResponse } from "@/lib/types";

export interface UseCampaignsOptions {
  date?: string; // yyyy-MM-dd filter
}

const campaignsFetcher = async (date?: string): Promise<CampaignListResponse> => {
  const searchParams = new URLSearchParams();
  if (date) {
    searchParams.set("date", date);
  }
  const query = searchParams.toString();
  const response = await fetch(`/api/campaigns${query ? `?${query}` : ""}`);

  if (!response.ok) {
    throw new Error(`Failed to load campaigns (${response.status})`);
  }

  return (await response.json()) as CampaignListResponse;
};

export const useCampaigns = (options: UseCampaignsOptions = {}) =>
  useQuery({
    queryKey: ["campaigns", options.date ?? "all"],
    queryFn: () => campaignsFetcher(options.date),
    staleTime: 1000 * 60 * 5, // Consider fresh for 5 minutes (matches API revalidate)
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
