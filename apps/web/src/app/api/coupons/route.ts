import { NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";

export const revalidate = 0;

export const GET = async () => {
  try {
    // Check authentication
    const { error } = await requireAuth();
    if (error) return error;

    const data = await mcpClient.getCoupons();
    return NextResponse.json(data);
  } catch (error) {
    return handleApiError(error);
  }
};
