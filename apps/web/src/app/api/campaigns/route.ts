import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { withRateLimit } from "@/lib/withRateLimit";
import { validateQuery, campaignQuerySchema } from "@/lib/validation";

export const revalidate = 0;

export const GET = withRateLimit(async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data, error } = validateQuery(searchParams, campaignQuerySchema);
    if (error) return error;

    const campaigns = await mcpClient.getCampaigns(data.date);
    return NextResponse.json(campaigns);
  } catch (error) {
    return handleApiError(error);
  }
}, "api");
