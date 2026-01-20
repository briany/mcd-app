import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const allowedOrigins = [
  "http://localhost:3000",
  "https://mcd-app.example.com", // Replace with actual production domain
];

function setCorsHeaders(response: NextResponse, origin: string | null) {
  if (origin && allowedOrigins.includes(origin)) {
    response.headers.set("Access-Control-Allow-Origin", origin);
    response.headers.set("Access-Control-Allow-Credentials", "true");
  }
}

/**
 * Security headers middleware
 * Adds security headers to all responses
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const origin = request.headers.get("origin");

  setCorsHeaders(response, origin);

  // Prevent clickjacking attacks
  response.headers.set("X-Frame-Options", "DENY");

  // Prevent MIME type sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Control referrer information
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict browser features (permissions policy)
  response.headers.set(
    "Permissions-Policy",
    "geolocation=(), microphone=(), camera=(), payment=(), usb=(), interest-cohort=()"
  );

  // Content Security Policy
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: unsafe-* needed for Next.js dev
    "style-src 'self' 'unsafe-inline'", // Needed for Next.js styles
    "img-src 'self' https://mcd-portal-prod-cos1-1300270282.cos.ap-shanghai.myqcloud.com https://cms-cdn.mcd.cn https://img.mcd.cn data:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join("; ");
  response.headers.set("Content-Security-Policy", csp);

  // HSTS (only for HTTPS)
  if (request.nextUrl.protocol === "https:") {
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains"
    );
  }

  return response;
}

// Apply middleware to all routes except static files
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*|public).*)",
  ],
};
