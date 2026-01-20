import { NextRequest, NextResponse } from "next/server";
import { getCsrfTokenFromHeaders, verifyCsrfToken } from "./csrf";

/**
 * Higher-order function to protect API routes with CSRF validation
 */
export function withCsrf(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    // Only check CSRF for state-changing methods
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      const token = getCsrfTokenFromHeaders(request.headers);
      const isValid = await verifyCsrfToken(token);

      if (!isValid) {
        return NextResponse.json(
          { message: "Invalid CSRF token" },
          { status: 403 }
        );
      }
    }

    return handler(request);
  };
}
