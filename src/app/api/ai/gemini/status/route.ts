import { NextResponse } from "next/server";

/**
 * GET /api/ai/gemini/status
 * Check if Gemini API is available (API key configured)
 */
export async function GET() {
  const available = !!process.env.GEMINI_API_KEY;

  return NextResponse.json({
    available,
    service: "gemini",
  });
}
