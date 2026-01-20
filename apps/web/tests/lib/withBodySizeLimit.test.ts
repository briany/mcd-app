import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";

import { withBodySizeLimit } from "@/lib/withBodySizeLimit";

describe("withBodySizeLimit", () => {
  const mockHandler = vi.fn(async () => {
    return NextResponse.json({ success: true });
  });

  beforeEach(() => {
    mockHandler.mockClear();
  });

  it("allows requests within size limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "content-length": "1024", // 1KB
      },
    });

    const wrappedHandler = withBodySizeLimit(mockHandler, 1024 * 1024);
    const response = await wrappedHandler(request);

    expect(mockHandler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("blocks requests exceeding size limit", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "content-length": "2097152", // 2MB
      },
    });

    const wrappedHandler = withBodySizeLimit(mockHandler, 1024 * 1024);
    const response = await wrappedHandler(request);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(413);

    const body = await response.json();
    expect(body.message).toContain("Request body too large");
  });

  it("allows requests without content-length header", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
    });

    const wrappedHandler = withBodySizeLimit(mockHandler, 1024 * 1024);
    const response = await wrappedHandler(request);

    expect(mockHandler).toHaveBeenCalled();
    expect(response.status).toBe(200);
  });

  it("respects custom size limits", async () => {
    const request = new NextRequest("http://localhost:3000/api/test", {
      method: "POST",
      headers: {
        "content-length": "2048", // 2KB
      },
    });

    const wrappedHandler = withBodySizeLimit(mockHandler, 1024); // 1KB limit
    const response = await wrappedHandler(request);

    expect(mockHandler).not.toHaveBeenCalled();
    expect(response.status).toBe(413);
  });
});
