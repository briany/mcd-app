"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutoClaimResponse, CouponListResponse } from "@/lib/types";
import { handleFetchError } from "@/lib/fetchUtils";
import { useCsrf } from "./useCsrf";

async function fetchAvailableCoupons(): Promise<CouponListResponse> {
  const response = await fetch("/api/available-coupons");
  if (!response.ok) {
    await handleFetchError(response, "Failed to load available coupons");
  }
  return response.json();
}

export function useAvailableCoupons() {
  const queryClient = useQueryClient();
  const { getCsrfHeaders } = useCsrf();

  const invalidateCouponQueries = () => {
    queryClient.invalidateQueries({ queryKey: ["available-coupons"] });
    queryClient.invalidateQueries({ queryKey: ["coupons"] });
  };

  const query = useQuery({
    queryKey: ["available-coupons"],
    queryFn: fetchAvailableCoupons,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
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

      if (!response.ok) {
        await handleFetchError(response, "Failed to auto-claim coupons");
      }

      return response.json() as Promise<AutoClaimResponse>;
    },
    onSuccess: invalidateCouponQueries,
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

      if (!response.ok) {
        await handleFetchError(response, "Failed to claim coupon");
      }

      return response.json() as Promise<AutoClaimResponse>;
    },
    onSuccess: invalidateCouponQueries,
  });

  return {
    ...query,
    autoClaim: autoClaimMutation.mutateAsync,
    isAutoClaiming: autoClaimMutation.isPending,
    claimCoupon: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
}
