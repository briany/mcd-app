import { NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";

export const POST = async () => {
  try {
    const result = await mcpClient.autoClaimCoupons();
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
};
