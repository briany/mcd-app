import { NextResponse, NextRequest } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withRateLimit } from "@/lib/withRateLimit";
import { handleCorsPreFlight } from "@/lib/corsHelpers";

export const revalidate = 0;

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
