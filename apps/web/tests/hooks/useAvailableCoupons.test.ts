import { renderHook, waitFor } from "@testing-library/react";

import { useAvailableCoupons } from "@/hooks/useAvailableCoupons";
import type { CouponListResponse, AutoClaimResponse } from "@/lib/types";
import { createQueryWrapper } from "../utils";

const createCsrfResponse = (): Response =>
  ({
    ok: true,
    status: 200,
    json: async () => ({ token: "test-csrf-token" }),
  }) as Response;

const mockFetchWithCsrf = (handler: (url: string) => Response | Promise<Response>) =>
  vi.spyOn(globalThis, "fetch").mockImplementation(async (url) => {
    if (url === "/api/csrf-token") {
      return createCsrfResponse();
    }
    if (typeof url !== "string") {
      throw new Error("Unexpected URL");
    }
    return handler(url);
  });

describe("useAvailableCoupons", () => {
  describe("query", () => {
    it("returns available coupon data on success", async () => {
      const mockResponse: CouponListResponse = {
        coupons: [
          {
            id: "avail-1",
            name: "Available Coupon",
            expiryDate: "2099-01-01",
            status: "active",
            imageUrl: null,
          },
        ],
        total: 1,
        page: 1,
      };

      const fetchSpy = mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => mockResponse,
          } as Response;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(mockResponse);
      expect(fetchSpy).toHaveBeenCalledWith("/api/available-coupons");
    });

    it("handles error when API call fails", async () => {
      mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
          return {
            ok: false,
            status: 500,
          } as Response;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isError).toBe(true));
      expect(result.current.error).toBeTruthy();
    });

    it("shows loading state initially", () => {
      mockFetchWithCsrf((url) => {
        if (url === "/api/available-coupons") {
          return new Promise<Response>(() => {});
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });
  });

  describe("autoClaim mutation", () => {
    it("successfully auto-claims coupons", async () => {
      const mockAutoClaimResponse: AutoClaimResponse = {
        success: true,
        claimed: 5,
        message: "Claimed 5 coupons",
      };

      const fetchSpy = mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ coupons: [], total: 0, page: 1 }),
          } as Response;
        }
        if (url === "/api/available-coupons/auto-claim") {
          return {
            ok: true,
            status: 200,
            json: async () => mockAutoClaimResponse,
          } as Response;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await result.current.autoClaim();

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/available-coupons/auto-claim",
        expect.objectContaining({
          method: "POST",
        })
      );
    });

    it("handles auto-claim error", async () => {
      mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ coupons: [], total: 0, page: 1 }),
          } as Response;
        }
        if (url === "/api/available-coupons/auto-claim") {
          return {
            ok: false,
            status: 500,
            text: async () => "Server error",
          } as Response;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await expect(result.current.autoClaim()).rejects.toThrow();
    });

    it("sets isAutoClaiming to true while claiming", async () => {
      let resolveAutoClaim: (value: Response) => void;
      const autoClaimPromise = new Promise<Response>((resolve) => {
        resolveAutoClaim = resolve;
      });

      mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
          return {
            ok: true,
            status: 200,
            json: async () => ({ coupons: [], total: 0, page: 1 }),
          } as Response;
        }
        if (url === "/api/available-coupons/auto-claim") {
          return autoClaimPromise;
        }
        throw new Error("Unexpected URL");
      });

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      result.current.autoClaim();

      await waitFor(() => expect(result.current.isAutoClaiming).toBe(true));

      resolveAutoClaim!({
        ok: true,
        status: 200,
        json: async () => ({ success: true, claimed: 5, message: "OK" }),
      } as Response);

      await waitFor(() => expect(result.current.isAutoClaiming).toBe(false));
    });
  });

  describe("claimCoupon mutation", () => {
    it("successfully claims a single coupon", async () => {
      const mockClaimResponse: AutoClaimResponse = {
        success: true,
        claimed: 1,
        message: "Coupon claimed",
      };

      const fetchSpy = mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
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

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      await result.current.claimCoupon("test-coupon-id");

      expect(fetchSpy).toHaveBeenCalledWith(
        "/api/coupons/claim",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
            "x-csrf-token": "test-csrf-token",
          }),
          body: JSON.stringify({ couponId: "test-coupon-id" }),
        })
      );
    });

    it("handles claim error", async () => {
      mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
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

      const { result } = renderHook(() => useAvailableCoupons(), {
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

      mockFetchWithCsrf(async (url) => {
        if (url === "/api/available-coupons") {
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

      const { result } = renderHook(() => useAvailableCoupons(), {
        wrapper: createQueryWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      result.current.claimCoupon("test-id");

      await waitFor(() => expect(result.current.isClaiming).toBe(true));

      resolveClaim!({
        ok: true,
        status: 200,
        json: async () => ({ success: true, claimed: 1, message: "OK" }),
      } as Response);

      await waitFor(() => expect(result.current.isClaiming).toBe(false));
    });
  });
});
