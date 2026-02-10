import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withCsrf } from "@/lib/withCsrf";
import { withRateLimit } from "@/lib/withRateLimit";
import { withBodySizeLimit } from "@/lib/withBodySizeLimit";
import { validateBody, claimCouponSchema } from "@/lib/validation";
import { handleCorsPreFlight } from "@/lib/corsHelpers";

/**
 * Claim coupon endpoint
 *
 * Note: MCP server only supports batch auto-claim, not individual coupon claiming.
 * This endpoint triggers auto-claim for all available coupons regardless of the couponId.
 * This maintains UI compatibility but the behavior is to claim all, not just one.
 */
export const POST = withRateLimit(
  withCsrf(
    withBodySizeLimit(async (request: NextRequest) => {
      try {
        // Check authentication
        const { error: authError } = await requireAuth();
        if (authError) return authError;

        // Validate request body
        const { error: validationError } = await validateBody(request, claimCouponSchema);
        if (validationError) return validationError;

        // MCP server only supports auto-claim, not single-claim
        // Trigger auto-claim for all available coupons
        const result = await mcpClient.autoClaimCoupons();
        return NextResponse.json(result);
      } catch (error) {
        return handleApiError(error);
      }
    })
  ),
  "write"
);

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
