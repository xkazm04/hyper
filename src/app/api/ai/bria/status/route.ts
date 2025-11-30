import { NextResponse } from 'next/server'
import { isBriaAvailable } from '@/lib/services/briaClient'

/**
 * GET /api/ai/bria/status
 * Check if Bria AI API is available (API key configured)
 */
export async function GET() {
  return NextResponse.json({
    available: isBriaAvailable(),
  })
}
