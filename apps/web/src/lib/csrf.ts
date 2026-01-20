import { Tokens } from "csrf";
import { cookies } from "next/headers";

const tokens = new Tokens();
const CSRF_SECRET_COOKIE = "csrf-secret";
const CSRF_TOKEN_HEADER = "x-csrf-token";

/**
 * Generate a CSRF token for the current session
 */
export async function generateCsrfToken(): Promise<string> {
  const cookieStore = await cookies();
  let secret = cookieStore.get(CSRF_SECRET_COOKIE)?.value;

  if (!secret) {
    secret = tokens.secretSync();
    cookieStore.set(CSRF_SECRET_COOKIE, secret, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24, // 24 hours
    });
  }

  return tokens.create(secret);
}

/**
 * Verify a CSRF token from a request
 */
export async function verifyCsrfToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  const cookieStore = await cookies();
  const secret = cookieStore.get(CSRF_SECRET_COOKIE)?.value;

  if (!secret) return false;

  return tokens.verify(secret, token);
}

/**
 * Get CSRF token from request headers
 */
export function getCsrfTokenFromHeaders(headers: Headers): string | null {
  return headers.get(CSRF_TOKEN_HEADER);
}

/**
 * Invalidate the CSRF secret (call on logout)
 */
export async function invalidateCsrfToken(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(CSRF_SECRET_COOKIE);
}

export { CSRF_TOKEN_HEADER, CSRF_SECRET_COOKIE };
