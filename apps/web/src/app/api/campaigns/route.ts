import { NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";

export const revalidate = 0;

export const GET = async (request: Request) => {
  try {
    // Check authentication
    const { error, session } = await requireAuth();
    if (error) return error;

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    const data = await mcpClient.getCampaigns(date);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
};
