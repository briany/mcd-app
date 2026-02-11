import type { NextRequest } from "next/server";

export interface RequestLog {
  method: string;
  url: string;
  ip: string;
  userAgent: string;
  timestamp: string;
  userId?: string;
}

export interface SecurityEvent {
  type: string;
  userId?: string;
  ip?: string;
  details?: unknown;
  timestamp: string;
}

export interface SecurityRequestContext {
  method: string;
  pathname: string;
  origin?: string;
}

/**
 * Log incoming requests (can be extended to send to logging service)
 */
export function logRequest(request: NextRequest, userId?: string): RequestLog {
  const log: RequestLog = {
    method: request.method,
    url: request.url,
    ip:
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown",
    userAgent: request.headers.get("user-agent") || "unknown",
    timestamp: new Date().toISOString(),
    userId,
  };

  // In production, send to logging service (e.g., DataDog, Sentry)
  if (process.env.NODE_ENV === "development") {
    console.log("[Request]", log);
  }

  return log;
}

/**
 * Log security events that need attention
 */
export function logSecurityEvent(event: Omit<SecurityEvent, "timestamp">): void {
  const fullEvent: SecurityEvent = {
    ...event,
    timestamp: new Date().toISOString(),
  };

  // Always log security events
  console.warn("[Security Event]", fullEvent);

  // In production, send to security monitoring service
  // TODO: Integrate with Sentry, DataDog, or similar
}

/**
 * Security logs should avoid URLs with query params and other noisy metadata.
 */
export function getSecurityRequestContext(
  request: NextRequest,
  options?: { includeOrigin?: boolean }
): SecurityRequestContext {
  const context: SecurityRequestContext = {
    method: request.method,
    pathname: request.nextUrl.pathname,
  };

  if (options?.includeOrigin) {
    const origin = request.headers.get("origin");
    if (origin) {
      context.origin = origin;
    }
  }

  return context;
}
