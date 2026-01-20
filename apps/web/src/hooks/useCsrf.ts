"use client";

import { useQuery } from "@tanstack/react-query";

const CSRF_TOKEN_HEADER = "x-csrf-token";

async function fetchCsrfToken(): Promise<string> {
  const response = await fetch("/api/csrf-token");
  if (!response.ok) {
    throw new Error("Failed to fetch CSRF token");
  }
  const data = await response.json();
  return data.token;
}

export function useCsrf() {
  const { data: token } = useQuery({
    queryKey: ["csrf-token"],
    queryFn: fetchCsrfToken,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchInterval: 1000 * 60 * 60, // Refresh every hour
  });

  const getCsrfHeaders = () => {
    if (!token) return {};
    return { [CSRF_TOKEN_HEADER]: token };
  };

  return { token, getCsrfHeaders };
}
