import { describe, expect, it } from "vitest";

import { handleFetchError } from "@/lib/fetchUtils";

describe("handleFetchError", () => {
  it("includes retry seconds when Retry-After header is present", async () => {
    const response = new Response("", {
      status: 429,
      headers: { "Retry-After": "30" },
    });

    await expect(
      handleFetchError(response, "Request failed")
    ).rejects.toThrow("Too many requests. Please try again in 30 seconds.");
  });

  it("falls back to a generic message when Retry-After is missing", async () => {
    const response = new Response("", { status: 429 });

    await expect(
      handleFetchError(response, "Request failed")
    ).rejects.toThrow("Too many requests. Please try again later.");
  });
});
