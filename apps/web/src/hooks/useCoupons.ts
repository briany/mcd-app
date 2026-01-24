"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutoClaimResponse, CouponListResponse } from "@/lib/types";
import { handleFetchError } from "@/lib/fetchUtils";
import { useCsrf } from "./useCsrf";

async function fetchCoupons(): Promise<CouponListResponse> {
  const response = await fetch("/api/coupons");
  if (!response.ok) {
    await handleFetchError(response, "Failed to load coupons");
  }
  return response.json();
}

export function useCoupons() {
  const queryClient = useQueryClient();
  const { getCsrfHeaders } = useCsrf();

  const query = useQuery({
    queryKey: ["coupons"],
    queryFn: fetchCoupons,
    staleTime: 1000 * 60,
    gcTime: 1000 * 60 * 5,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const claimMutation = useMutation({
    mutationKey: ["claim-coupon"],
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coupons"] });
      queryClient.invalidateQueries({ queryKey: ["available-coupons"] });
    },
  });

  return {
    ...query,
    claimCoupon: claimMutation.mutateAsync,
    isClaiming: claimMutation.isPending,
  };
}
