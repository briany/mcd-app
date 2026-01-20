import { NextResponse } from "next/server";
import { z } from "zod";

import { McpClientError } from "@/lib/mcpClient";

/**
 * Sanitize error for client response based on environment
 */
function sanitizeError(error: unknown): { message: string; details?: unknown } {
  const isDevelopment = process.env.NODE_ENV === "development";

  // MCP client errors
  if (error instanceof McpClientError) {
    return {
      message: isDevelopment
        ? error.message
        : "An error occurred while processing your request",
      ...(isDevelopment && error.details && { details: error.details }),
    };
  }

  // Validation errors
  if (error instanceof z.ZodError) {
    return {
      message: "Validation failed",
      ...(isDevelopment && {
        details: error.issues.map((e) => ({
          path: e.path.join("."),
          message: e.message,
        })),
      }),
    };
  }

  // Generic errors
  if (error instanceof Error) {
    return {
      message: isDevelopment ? error.message : "An unexpected error occurred",
      ...(isDevelopment && error.stack && { details: { stack: error.stack } }),
    };
  }

  // Unknown errors
  return {
    message: "An unexpected error occurred",
  };
}

/**
 * Determine HTTP status code from error
 */
function getErrorStatus(error: unknown): number {
  if (error instanceof McpClientError) {
    return error.status;
  }
  if (error instanceof z.ZodError) {
    return 400;
  }
  return 500;
}

/**
 * Handle API errors with proper logging and sanitization
 */
export const handleApiError = (error: unknown) => {
  // Always log full error server-side
  console.error("[API Error]", {
    error,
    timestamp: new Date().toISOString(),
    stack: error instanceof Error ? error.stack : undefined,
    ...(error instanceof McpClientError && { mcpDetails: error.details }),
  });

  // Determine status and sanitize for client
  const status = getErrorStatus(error);
  const sanitized = sanitizeError(error);

  return NextResponse.json(sanitized, { status });
};
