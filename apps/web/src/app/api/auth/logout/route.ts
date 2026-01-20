import { NextResponse } from "next/server";
import { invalidateCsrfToken } from "@/lib/csrf";

export const POST = async () => {
  try {
    // Invalidate CSRF token
    await invalidateCsrfToken();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json(
      { message: "Logout failed" },
      { status: 500 }
    );
  }
};
