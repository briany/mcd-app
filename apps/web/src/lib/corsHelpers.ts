import { NextRequest, NextResponse } from "next/server";

import { allowedOrigins } from "@/lib/config";

export function handleCorsPreFlight(request: NextRequest): NextResponse {
  const origin = request.headers.get("origin");

  if (!origin || !allowedOrigins.includes(origin)) {
    return new NextResponse(null, { status: 403 });
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": origin,
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
      "Access-Control-Allow-Credentials": "true",
      "Access-Control-Max-Age": "86400",
      Vary: "Origin",
    },
  });
}
