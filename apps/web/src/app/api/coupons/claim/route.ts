import { NextRequest, NextResponse } from "next/server";

import { mcpClient } from "@/lib/mcpClient";
import { handleApiError } from "@/lib/api";

export const POST = async (request: NextRequest) => {
  try {
    const { couponId } = await request.json();
    if (!couponId || typeof couponId !== "string") {
      return NextResponse.json({ message: "couponId is required" }, { status: 400 });
    }

    const result = await mcpClient.claimCoupon(couponId);
    return NextResponse.json(result);
  } catch (error) {
    return handleApiError(error);
  }
};
