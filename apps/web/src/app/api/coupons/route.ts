import { NextResponse, NextRequest } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { handleCorsPreFlight } from "@/lib/corsHelpers";

export const revalidate = 0;

export const GET = async () => {
  try {
    const data = await mcpClient.getCoupons();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
};

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
