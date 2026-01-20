import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";
import { withBodySizeLimit } from "@/lib/withBodySizeLimit";

export const POST = withBodySizeLimit(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_request: NextRequest) => {
    try {
      const result = await mcpClient.autoClaimCoupons();
      return NextResponse.json(result);
    } catch (error) {
      return handleApiError(error);
    }
  },
  512 * 1024 // 512KB (small since this endpoint has no body)
);
