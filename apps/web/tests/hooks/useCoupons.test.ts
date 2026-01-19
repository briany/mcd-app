import { renderHook, waitFor } from "@testing-library/react";

import { useCoupons } from "@/hooks/useCoupons";
import type { CouponListResponse, AutoClaimResponse } from "@/lib/types";
import { createQueryWrapper } from "../utils";

describe("useCoupons", () => {
  describe("query", () => {
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

    it("handles error when API call fails", async () => {
      const fetchSpy = vi
        .spyOn(globalThis, "fetch")
        .mockResolvedValue({
          ok: false,
          status: 500,
        } as Response);

      const { result } = renderHook(() => useCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
      expect(fetchSpy).toHaveBeenCalledWith("/api/coupons");
    });

    it("shows loading state initially", () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      const { result } = renderHook(() => useCoupons(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("claimCoupon mutation", () => {
    it("successfully claims a coupon", async () => {
      const mockClaimResponse: AutoClaimResponse = {
        success: true,
        claimed: 1,
        message: "Coupon claimed",
      };

      const fetchSpy = vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (url === "/api/coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ coupons: [], total: 0, page: 1 }),
          } as Response;
        }
        if (url === "/api/coupons/claim") {
          return {
            ok: true,
            status: 200,
            json: async () => mockClaimResponse,
          } as Response;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await result.current.claimCoupon("test-coupon-id");

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/coupons/claim",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ couponId: "test-coupon-id" }),
        })
      );
    });

    it("handles claim error", async () => {
      vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (url === "/api/coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ coupons: [], total: 0, page: 1 }),
          } as Response;
        }
        if (url === "/api/coupons/claim") {
          return {
            ok: false,
            status: 400,
            text: async () => "Invalid coupon ID",
          } as Response;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await expect(result.current.claimCoupon("invalid-id")).rejects.toThrow();
    });

    it("sets isClaiming to true while claiming", async () => {
      let resolveClaim: (value: Response) => void;
      const claimPromise = new Promise<Response>((resolve) => {
        resolveClaim = resolve;
      });

      vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
        if (url === "/api/coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ coupons: [], total: 0, page: 1 }),
          } as Response;
        }
        if (url === "/api/coupons/claim") {
          return claimPromise;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      // Start claiming
      result.current.claimCoupon("test-id");

      await waitFor(() => expect(result.current.isClaiming).toBe(true));

      // Resolve the claim
      resolveClaim!({
        ok: true,
        status: 200,
        json: async () => ({ success: true, claimed: 1, message: "OK" }),
      } as Response);

      await waitFor(() => expect(result.current.isClaiming).toBe(false));
    });
  });
});
