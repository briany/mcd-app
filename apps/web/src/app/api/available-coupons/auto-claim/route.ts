import { NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { withRateLimit } from "@/lib/withRateLimit";

export const POST = withRateLimit(async () => {
  try {
    const result = await mcpClient.autoClaimCoupons();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
}, "autoClaim");
