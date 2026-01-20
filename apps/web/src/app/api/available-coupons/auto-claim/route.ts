import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { requireAuth } from "@/lib/authHelpers";
import { withCsrf } from "@/lib/withCsrf";
import { withRateLimit } from "@/lib/withRateLimit";
import { withBodySizeLimit } from "@/lib/withBodySizeLimit";

export const POST = withRateLimit(
  withCsrf(
    withBodySizeLimit(
      async (request: NextRequest) => {
        try {
          // Check authentication
          const { error } = await requireAuth(request);
          if (error) return error;

          const result = await mcpClient.autoClaimCoupons();
          return NextResponse.json(result);
        } catch (error) {
          return handleApiError(error);
        }
      },
      512 * 1024 // 512KB (small since this endpoint has no body)
    )
  ),
  "autoClaim"
);
