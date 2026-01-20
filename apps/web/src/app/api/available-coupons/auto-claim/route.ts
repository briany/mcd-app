import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withCsrf } from "@/lib/withCsrf";

export const POST = withCsrf(async (request: NextRequest) => {
  try {
    // Check authentication
    const { error, session } = await requireAuth();
    if (error) return error;

    const result = await mcpClient.autoClaimCoupons();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
