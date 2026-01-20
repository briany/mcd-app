import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_SIZE = 1024 * 1024; // 1MB in bytes

/**
 * Higher-order function to enforce body size limits on API routes
 */
export function withBodySizeLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  maxSize: number = MAX_BODY_SIZE
) {
  return async (request: NextRequest) => {
    const contentLength = request.headers.get("content-length");

    if (contentLength) {
      const size = parseInt(contentLength, 10);
      if (size > maxSize) {
        return NextResponse.json(
          {
            message: `Request body too large. Maximum size is ${Math.round(
              maxSize / 1024
            )}KB.`,
            maxSize,
            receivedSize: size,
          },
          { status: 413 }
        );
      }
    }

    return handler(request);
  };
}
