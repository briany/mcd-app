"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutoClaimResponse, CouponListResponse } from "@/lib/types";
import { useCsrf } from "./useCsrf";

const availableFetcher = async (): Promise<CouponListResponse> => {
  const response = await fetch("/api/available-coupons");
  if (!response.ok) {
    throw new Error(`Failed to load available coupons (${response.status})`);
  }
  return (await response.json()) as CouponListResponse;
};

export const useAvailableCoupons = () => {
  const queryClient = useQueryClient();
  const { getCsrfHeaders } = useCsrf();

  const query = useQuery({
    queryKey: ["available-coupons"],
    queryFn: availableFetcher,
    staleTime: 1000 * 60, // Consider fresh for 1 minute
    gcTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const autoClaimMutation = useMutation({
    mutationKey: ["auto-claim"],
    mutationFn: async () => {
      const response = await fetch("/api/available-coupons/auto-claim", {
        method: "POST",
        headers: getCsrfHeaders(),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new Error(
          `Too many requests. Please try again in ${retryAfter} seconds.`
        );
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to auto-claim coupons (${response.status})`);
      }

      return (await response.json()) as AutoClaimResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });

  const claimMutation = useMutation({
    mutationKey: ["claim-from-available"],
    mutationFn: async (couponId: string) => {
      const response = await fetch("/api/coupons/claim", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getCsrfHeaders(),
        },
        body: JSON.stringify({ couponId }),
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get("Retry-After");
        throw new Error(
          `Too many requests. Please try again in ${retryAfter} seconds.`
        );
      }

      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || `Failed to claim coupon (${response.status})`);
      }

      return (await response.json()) as AutoClaimResponse;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["available-coupons"] });
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
    },
  });

  return {
    ...query,
    autoClaim: autoClaimMutation.mutateAsync,
    isAutoClaiming: autoClaimMutation.isPending,
    claimCoupon: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
};
