"use client";

import { useQuery } from "@tanstack/react-query";

const CSRF_TOKEN_HEADER = "x-csrf-token";

function parseCsrfToken(data: unknown): string {
  if (
    typeof data !== "object" ||
    data === null ||
    typeof (data as { token?: unknown }).token !== "string"
  ) {
    throw new Error("Invalid CSRF token response");
  }

  return (data as { token: string }).token;
}

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch("/api/csrf-token");
  if (!response.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  return parseCsrfToken(await response.json());
}

export function useCsrf() {
  const { data: token } = useQuery({
    queryKey: ["csrf-token"],
    queryFn: fetchCsrfToken,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Refresh every hour
  });

  const getCsrfHeaders = (): Record<string, string> => {
    if (!token) return {};
    return { [CSRF_TOKEN_HEADER]: token };
  };

  return { token, getCsrfHeaders };
}
