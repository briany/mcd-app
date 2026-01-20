import { withAuth } from "next-auth/middleware";
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

export default withAuth(
  function middleware(req: NextRequest) {
    const response = NextResponse.next();
    const origin = req.headers.get("origin");

    // CORS headers
    setCorsHeaders(response, origin);

    // Security Headers

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
    const csp = [
      "default-src 'self'",
      // Allow unsafe-eval and unsafe-inline for Next.js development
      process.env.NODE_ENV === "production"
        ? "script-src 'self'"
        : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      process.env.NODE_ENV === "production"
        ? "style-src 'self'"
        : "style-src 'self' 'unsafe-inline'",
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

    return response;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    // Protect all API routes except auth endpoints
    "/api/coupons/:path*",
    "/api/available-coupons/:path*",
    "/api/campaigns/:path*",
    // Protect all pages except auth pages, static files, and public assets
    "/((?!api/auth|auth|_next/static|_next/image|favicon.ico).*)",
  ],
};
