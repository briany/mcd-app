import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";

import { useCsrf } from "@/hooks/useCsrf";

const createWrapperWithClient = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
    },
  });

  const QueryWrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  QueryWrapper.displayName = "QueryWrapper";

  return { queryClient, wrapper: QueryWrapper };
};

describe("useCsrf", () => {
  it("returns token and csrf headers when the API call succeeds", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: "test-csrf-token" }),
    } as Response);

    const { wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useCsrf(), { wrapper });

    await waitFor(() => expect(result.current.token).toBe("test-csrf-token"));
    expect(result.current.getCsrfHeaders()).toEqual({
      "x-csrf-token": "test-csrf-token",
    });
  });

  it("rejects malformed response when token is missing", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({}),
    } as Response);

    const { queryClient, wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useCsrf(), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(["csrf-token"])?.status).toBe("error")
    );

    const error = queryClient.getQueryState(["csrf-token"])?.error as Error;
    expect(error.message).toBe("Invalid CSRF token response");
    expect(result.current.token).toBeUndefined();
    expect(result.current.getCsrfHeaders()).toEqual({});
  });

  it("rejects malformed response when token is not a string", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ token: 123 }),
    } as Response);

    const { queryClient, wrapper } = createWrapperWithClient();
    const { result } = renderHook(() => useCsrf(), { wrapper });

    await waitFor(() =>
      expect(queryClient.getQueryState(["csrf-token"])?.status).toBe("error")
    );

    const error = queryClient.getQueryState(["csrf-token"])?.error as Error;
    expect(error.message).toBe("Invalid CSRF token response");
    expect(result.current.token).toBeUndefined();
    expect(result.current.getCsrfHeaders()).toEqual({});
  });
});
