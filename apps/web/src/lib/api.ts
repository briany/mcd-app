import { NextResponse } from "next/server";

import { McpClientError } from "@/lib/mcpClient";

export const handleApiError = (error: unknown) => {
  if (error instanceof McpClientError) {
    return NextResponse.json(
      {
        message: error.message,
        details: error.details,
      },
      { status: error.status }
    );
  }

  console.error("Unexpected MCP API error", error);
  return NextResponse.json({ message: "Unexpected MCP API error" }, { status: 500 });
};
