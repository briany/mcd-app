import { NextRequest, NextResponse } from "next/server";
import { invalidateCsrfToken } from "@/lib/csrf";
import { requireAuth } from "@/lib/authHelpers";
import { withCsrf } from "@/lib/withCsrf";
import { withRateLimit } from "@/lib/withRateLimit";
import { handleCorsPreFlight } from "@/lib/corsHelpers";

export const POST = withRateLimit(
  withCsrf(async () => {
    try {
      // Check authentication
      const { error } = await requireAuth();
      if (error) return error;

      // Invalidate CSRF token
      await invalidateCsrfToken();

      return NextResponse.json({ success: true });
    } catch (error) {
      console.error("Logout error:", error);
      return NextResponse.json(
        { message: "Logout failed" },
        { status: 500 }
      );
    }
  }),
  "write"
);

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreFlight(request);
}
