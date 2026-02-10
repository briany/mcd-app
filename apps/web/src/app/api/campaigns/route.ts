import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withRateLimit } from "@/lib/withRateLimit";
import { validateQuery, campaignQuerySchema } from "@/lib/validation";
import { handleCorsPreFlight } from "@/lib/corsHelpers";

// Authenticated data should not be statically cached.
export const dynamic = "force-dynamic";

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    // Check authentication
    const { error: authError } = await requireAuth();
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const { data, error } = validateQuery(searchParams, campaignQuerySchema);
    if (error) return error;

    const campaigns = await mcpClient.getCampaigns(data.date);
    return NextResponse.json(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
