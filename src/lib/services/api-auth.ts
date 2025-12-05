import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { MarketplaceApiKey, InvalidApiKeyError, RateLimitExceededError } from '@/lib/types'

export interface ApiAuthResult {
  success: true
  apiKey: MarketplaceApiKey
}

export interface ApiAuthError {
  success: false
  response: NextResponse
}

/**
 * Authenticate API requests using API key from header
 */
export async function authenticateApiKey(
  request: NextRequest,
  requiredScope: string
): Promise<ApiAuthResult | ApiAuthError> {
  const startTime = Date.now()

  // Get API key from header
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return {
      success: false,
      response: NextResponse.json(
        { error: 'Missing or invalid Authorization header. Use: Bearer <api_key>' },
        { status: 401 }
      ),
    }
  }

  const rawKey = authHeader.substring(7) // Remove 'Bearer ' prefix

  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    // Validate the API key
    const apiKey = await marketplaceService.validateApiKey(rawKey)

    // Check scope
    if (!marketplaceService.hasScope(apiKey, requiredScope)) {
      // Log the failed attempt
      await marketplaceService.logApiUsage(
        apiKey.id,
        request.nextUrl.pathname,
        request.method,
        undefined,
        403,
        Date.now() - startTime,
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined
      )

      return {
        success: false,
        response: NextResponse.json(
          { error: `Missing required scope: ${requiredScope}` },
          { status: 403 }
        ),
      }
    }

    // TODO: Implement rate limiting check here
    // For now, we just return the API key

    return { success: true, apiKey }
  } catch (error) {
    if (error instanceof InvalidApiKeyError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: error.message },
          { status: 401 }
        ),
      }
    }
    if (error instanceof RateLimitExceededError) {
      return {
        success: false,
        response: NextResponse.json(
          { error: error.message },
          { status: 429 }
        ),
      }
    }

    return {
      success: false,
      response: NextResponse.json(
        { error: 'Authentication failed' },
        { status: 500 }
      ),
    }
  }
}

/**
 * Log API usage after successful request
 */
export async function logApiRequest(
  apiKey: MarketplaceApiKey,
  request: NextRequest,
  assetId?: string,
  responseStatus?: number
): Promise<void> {
  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    await marketplaceService.logApiUsage(
      apiKey.id,
      request.nextUrl.pathname,
      request.method,
      assetId,
      responseStatus,
      undefined, // responseTimeMs is calculated at the route level
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )
  } catch (error) {
    // Silently fail logging errors
    console.error('Failed to log API request:', error)
  }
}
