import { NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";

export const revalidate = 0;

export const GET = async (request: Request) => {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;
    const data = await mcpClient.getCampaigns(date);
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
};
