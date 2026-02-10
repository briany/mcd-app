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

    // Enforce body size even when content-length is missing or inaccurate.
    if (["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
      try {
        const bodyBuffer = await request.clone().arrayBuffer();
        if (bodyBuffer.byteLength > maxSize) {
          return NextResponse.json(
            {
              message: `Request body too large. Maximum size is ${Math.round(
                maxSize / 1024
              )}KB.`,
              maxSize,
              receivedSize: bodyBuffer.byteLength,
            },
            { status: 413 }
          );
        }
      } catch {
        // If body cannot be read here, continue and let the handler surface parsing errors.
      }
    }

    return handler(request);
  };
}
