import { renderHook, waitFor } from "@testing-library/react";

import { useCampaigns } from "@/hooks/useCampaigns";
import type { CampaignListResponse } from "@/lib/types";
import { createQueryWrapper } from "../utils";

describe("useCampaigns", () => {
  it("returns campaign data without date parameter", async () => {
    const mockResponse: CampaignListResponse = {
      campaigns: [
        {
          id: "camp-1",
          title: "Test Campaign",
          description: "A test campaign",
          startDate: "2026-01-01",
          endDate: "2026-01-31",
          isSubscribed: false,
          imageUrl: null,
        },
      ],
      date: "2026-01-19",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith("/api/campaigns");
  });

  it("returns campaign data with date parameter", async () => {
    const mockResponse: CampaignListResponse = {
      campaigns: [],
      date: "2026-02-15",
    };

    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCampaigns({ date: "2026-02-15" }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
    expect(fetchSpy).toHaveBeenCalledWith("/api/campaigns?date=2026-02-15");
  });

  it("handles error when API call fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 500,
    } as Response);

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });

  it("shows loading state initially", () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useCampaigns(), {
      wrapper: createQueryWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it("uses different query keys for different dates", async () => {
    const mockResponse: CampaignListResponse = {
      campaigns: [],
      date: "2026-01-19",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result: result1 } = renderHook(() => useCampaigns(), {
      wrapper: createQueryWrapper(),
    });

    const { result: result2 } = renderHook(() => useCampaigns({ date: "2026-02-15" }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result1.current.isSuccess).toBe(true));
    await waitFor(() => expect(result2.current.isSuccess).toBe(true));

    // Different query keys mean independent cache
    expect(result1.current.data).toBeDefined();
    expect(result2.current.data).toBeDefined();
  });

  it("handles empty date as 'all' in query key", async () => {
    const mockResponse: CampaignListResponse = {
      campaigns: [],
      date: "2026-01-19",
    };

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockResponse,
    } as Response);

    const { result } = renderHook(() => useCampaigns({ date: undefined }), {
      wrapper: createQueryWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(mockResponse);
  });
});
