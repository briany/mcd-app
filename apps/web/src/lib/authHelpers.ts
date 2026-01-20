import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";

/**
 * Require authentication for API routes
 * Returns error response if not authenticated, or session if authenticated
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);

  if (!session) {
    return {
      error: NextResponse.json({ message: "Unauthorized" }, { status: 401 }),
      session: null,
    };
  }

  return { error: null, session };
}
