import { renderHook, waitFor } from "@testing-library/react";

import { useCoupons } from "@/hooks/useCoupons";
import type { CouponListResponse } from "@/lib/types";
import { createQueryWrapper } from "../utils";

describe("useCoupons", () => {
  it("returns coupon data when the API call succeeds", async () => {
    const mockResponse: CouponListResponse = {
      coupons: [
        {
          id: "abc",
          name: "Free Coffee",
          expiryDate: "2099-01-01",
          status: "Active",
          imageUrl: null,
        },
      ],
      total: 1,
      page: 1,
    };

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockResponse,
      } as Response);

    const { result } = renderHook(() => useCoupons(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith("/api/coupons");
  });
});
