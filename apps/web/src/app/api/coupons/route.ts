import { NextResponse, NextRequest } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withRateLimit } from "@/lib/withRateLimit";
import { handleCorsPreFlight } from "@/lib/corsHelpers";

// Authenticated data should not be statically cached.
export const dynamic = "force-dynamic";

export const GET = withRateLimit(async () => {
  try {
    // Check authentication
    const { error } = await requireAuth();
    if (error) return error;

    const data = await mcpClient.getCoupons();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
