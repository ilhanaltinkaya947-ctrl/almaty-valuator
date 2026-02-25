import { NextRequest, NextResponse } from "next/server";

/**
 * Validates the x-api-key header against AUTOMATION_API_KEY env var.
 * Returns null if valid, or a 401 response if invalid.
 */
export function validateApiKey(req: NextRequest): NextResponse | null {
  const apiKey = req.headers.get("x-api-key");
  const expected = process.env.AUTOMATION_API_KEY;

  if (!expected || apiKey !== expected) {
    return NextResponse.json(
      { error: "Unauthorized — invalid or missing x-api-key header" },
      { status: 401 },
    );
  }

  return null;
}
