import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { allowedOrigins } from "@/lib/config";

function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
}

function addSecurityHeaders(response: NextResponse, req: NextRequest) {
  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()"
  );

  // Content Security Policy
  // Note: Next.js requires 'unsafe-inline' for hydration scripts.
  // For stricter CSP, implement nonces via next.config.js headers.
  // See: https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
  const csp = [
    "default-src 'self'",
    // Next.js requires unsafe-inline for hydration and inline scripts
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https://mcd-portal-prod-cos1-1300270282.cos.ap-shanghai.myqcloud.com https://cms-cdn.mcd.cn https://img.mcd.cn data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // HSTS (only for HTTPS)
  if (req.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }
}

// Protected API routes that require authentication
const protectedApiRoutes = [
  "/api/coupons",
  "/api/available-coupons",
  "/api/campaigns",
];

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(req: NextRequest) {
  const response = NextResponse.next();
  const origin = req.headers.get("origin");
  const pathname = req.nextUrl.pathname;

  // CORS headers
  setCorsHeaders(response, origin);

  // Security headers for all routes
  addSecurityHeaders(response, req);

  // Only check auth for protected API routes
  if (isProtectedApiRoute(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
  }

  return response;
}

export const config = {
  matcher: [
    // Apply middleware to API routes and pages (for security headers)
    // Exclude static files and Next.js internals
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
