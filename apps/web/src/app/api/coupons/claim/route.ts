import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withCsrf } from "@/lib/withCsrf";

/**
 * Claim coupon endpoint
 *
 * Note: MCP server only supports batch auto-claim, not individual coupon claiming.
 * This endpoint triggers auto-claim for all available coupons regardless of the couponId.
 * This maintains UI compatibility but the behavior is to claim all, not just one.
 */
export const POST = withCsrf(async (request: NextRequest) => {
  try {
    // Check authentication
    const { error, session } = await requireAuth();
    if (error) return error;

    const { couponId } = await request.json();
    if (!couponId || typeof couponId !== "string") {
      return NextResponse.json({ message: "couponId is required" }, { status: 400 });
    }

    // MCP server only supports auto-claim, not single-claim
    // Trigger auto-claim for all available coupons
    const result = await mcpClient.autoClaimCoupons();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
});
