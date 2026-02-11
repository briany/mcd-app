import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

import { allowedOrigins } from "@/lib/config";
import { getSecurityRequestContext, logSecurityEvent } from "@/lib/logging";

function appendVaryHeader(response: NextResponse, value: string) {
  const current = response.headers.get("Vary");
  if (!current) {
    response.headers.set("Vary", value);
    return;
  }

  const parts = current
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (!parts.includes(value)) {
    response.headers.set("Vary", [...parts, value].join(", "));
  }
}

function setCorsHeaders(
  response: NextResponse,
  origin: string | null,
  isAllowedOrigin: boolean
) {
  if (origin && isAllowedOrigin) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
    appendVaryHeader(response, "Origin");
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
  const scriptSrc =
    process.env.NODE_ENV === "production"
      ? "script-src 'self' 'unsafe-inline'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const csp = [
    "default-src 'self'",
    // Next.js requires unsafe-inline for hydration and inline scripts
    scriptSrc,
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

// Protected pages that require authentication
const protectedPages = ["/", "/coupons", "/available", "/campaigns"];

// Public routes that don't require authentication
const publicRoutes = ["/auth/signin", "/auth/error", "/api/auth"];

function isProtectedApiRoute(pathname: string): boolean {
  return protectedApiRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isProtectedPage(pathname: string): boolean {
  return protectedPages.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isPublicRoute(pathname: string): boolean {
  return publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

export async function middleware(req: NextRequest) {
  const origin = req.headers.get("origin");
  const pathname = req.nextUrl.pathname;
  const isAllowedOrigin = origin ? allowedOrigins.includes(origin) : false;

  const finalizeResponse = (response: NextResponse): NextResponse => {
    setCorsHeaders(response, origin, isAllowedOrigin);
    addSecurityHeaders(response, req);
    return response;
  };

  if (origin && !isAllowedOrigin) {
    logSecurityEvent({
      type: "blocked_origin",
      details: getSecurityRequestContext(req, { includeOrigin: true }),
    });
  }

  const response = finalizeResponse(NextResponse.next());

  // Skip auth check for public routes
  if (isPublicRoute(pathname)) {
    return response;
  }

  // Skip auth in E2E test mode (controlled by environment variable)
  const isE2ETest = process.env.E2E_TEST_MODE === "true";
  const isProduction = process.env.NODE_ENV === "production";
  if (isE2ETest && !isProduction) {
    return response;
  }

  // Check auth for protected API routes
  if (isProtectedApiRoute(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      logSecurityEvent({
        type: "unauthorized_api_access",
        details: getSecurityRequestContext(req),
      });
      return finalizeResponse(
        NextResponse.json({ message: "Unauthorized" }, { status: 401 })
      );
    }
  }

  // Check auth for protected pages - redirect to sign-in
  if (isProtectedPage(pathname)) {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    if (!token) {
      logSecurityEvent({
        type: "unauthorized_page_access",
        details: getSecurityRequestContext(req),
      });
      const signInUrl = new URL("/auth/signin", req.url);
      signInUrl.searchParams.set("callbackUrl", pathname);
      return finalizeResponse(NextResponse.redirect(signInUrl));
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
