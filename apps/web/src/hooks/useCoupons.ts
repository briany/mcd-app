"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AutoClaimResponse, CouponListResponse } from "@/lib/types";

const couponsFetcher = async (): Promise<CouponListResponse> => {
  const response = await fetch("/api/coupons");
  if (!response.ok) {
    throw new Error(`Failed to load coupons (${response.status})`);
  }
  return (await response.json()) as CouponListResponse;
};

const claimFetcher = async (couponId: string): Promise<AutoClaimResponse> => {
  const response = await fetch("/api/coupons/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
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
};

export const useCoupons = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["coupons"],
    queryFn: couponsFetcher,
    staleTime: 1000 * 60 * 5,
  });

  const claimMutation = useMutation({
    mutationKey: ["claim-coupon"],
    mutationFn: claimFetcher,
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
};
