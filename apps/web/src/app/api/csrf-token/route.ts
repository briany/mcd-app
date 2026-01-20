import { NextResponse } from "next/server";
import { generateCsrfToken } from "@/lib/csrf";
import { requireAuth } from "@/lib/authHelpers";

export const GET = async () => {
  const { error } = await requireAuth();
  if (error) return error;

  const token = await generateCsrfToken();

  return NextResponse.json({ token });
};
