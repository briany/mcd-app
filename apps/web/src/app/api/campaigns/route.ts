import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withRateLimit } from "@/lib/withRateLimit";
import { validateQuery, campaignQuerySchema } from "@/lib/validation";

// Cache campaigns for 5 minutes (300 seconds)
export const revalidate = 300;

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
