import { NextResponse } from 'next/server'
import { SupabaseClient, User } from '@supabase/supabase-js'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  DatabaseError,
  StoryNotFoundError,
  CardNotFoundError,
  ChoiceNotFoundError,
  CharacterNotFoundError,
  CharacterCardNotFoundError,
  UnauthorizedError,
  ImageGenerationError,
  ImageUploadError,
  StoryValidationError,
  StaleVersionError,
  AssetNotFoundError,
  CollectionNotFoundError,
  ApiKeyNotFoundError,
  InvalidApiKeyError,
  RateLimitExceededError,
  InsufficientPermissionsError,
} from '@/lib/types'

// ============================================================================
// Authentication Result Types
// ============================================================================

export interface AuthSuccess {
  success: true
  user: User
  supabase: SupabaseClient
}

export interface AuthFailure {
  success: false
  response: NextResponse
}

export type AuthResult = AuthSuccess | AuthFailure

// ============================================================================
// Authentication Functions
// ============================================================================

/**
 * Authenticate a request using Supabase session.
 * Returns the authenticated user and supabase client, or an error response.
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   const auth = await authenticateRequest()
 *   if (!auth.success) return auth.response
 *
 *   const { user, supabase } = auth
 *   // ... use user and supabase
 * }
 * ```
 */
export async function authenticateRequest(): Promise<AuthResult> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        response: NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        ),
      }
    }

    return { success: true, user, supabase }
  } catch {
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
 * Options for authentication with demo mode support.
 */
export interface AuthWithDemoOptions {
  /** Check for demo mode cookie and skip auth if present */
  allowDemoMode?: boolean
  /** Custom cookie name for demo mode check */
  demoCookieName?: string
}

/**
 * Authenticate a request with optional demo mode support.
 * In demo mode, returns a mock user with id 'demo-user'.
 *
 * @example
 * ```ts
 * export async function POST(request: NextRequest) {
 *   const auth = await authenticateRequestWithDemo(request, { allowDemoMode: true })
 *   if (!auth.success) return auth.response
 *
 *   const { user, supabase } = auth
 *   // user.id may be 'demo-user' in demo mode
 * }
 * ```
 */
export async function authenticateRequestWithDemo(
  request: Request,
  options: AuthWithDemoOptions = {}
): Promise<AuthResult> {
  const { allowDemoMode = false, demoCookieName = 'demoMode' } = options

  if (allowDemoMode) {
    // Check for demo mode cookie
    const cookieHeader = request.headers.get('cookie') || ''
    const cookies = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [key, ...val] = c.trim().split('=')
        return [key, val.join('=')]
      })
    )

    if (cookies[demoCookieName] === 'true') {
      const supabase = await createServerSupabaseClient()
      // Return mock user for demo mode
      return {
        success: true,
        user: {
          id: 'demo-user',
          email: 'demo@example.com',
          app_metadata: {},
          user_metadata: {},
          aud: 'authenticated',
          created_at: new Date().toISOString(),
        } as User,
        supabase,
      }
    }
  }

  return authenticateRequest()
}

// ============================================================================
// Error Handler Types
// ============================================================================

export interface ApiErrorOptions {
  /** Log the error to console (default: true) */
  log?: boolean
  /** Custom log prefix (default: 'API Error') */
  logPrefix?: string
  /** Fallback error message when error type is unknown */
  fallbackMessage?: string
}

// ============================================================================
// Error Handler Functions
// ============================================================================

/**
 * Handle API errors and return appropriate NextResponse.
 * Maps known error types to appropriate HTTP status codes.
 *
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   try {
 *     // ... do something
 *   } catch (error) {
 *     return handleApiError(error, { fallbackMessage: 'Failed to fetch data' })
 *   }
 * }
 * ```
 */
export function handleApiError(
  error: unknown,
  options: ApiErrorOptions = {}
): NextResponse {
  const {
    log = true,
    logPrefix = 'API Error',
    fallbackMessage = 'An unexpected error occurred',
  } = options

  if (log) {
    console.error(`${logPrefix}:`, error)
  }

  // Handle StaleVersionError specially - includes extra fields
  if (error instanceof StaleVersionError) {
    return NextResponse.json(
      {
        error: 'Card has been modified by another session',
        code: 'STALE_VERSION',
        message: error.message,
        expectedVersion: error.expectedVersion,
        actualVersion: error.actualVersion,
      },
      { status: 409 }
    )
  }

  // 401 Unauthorized
  if (error instanceof UnauthorizedError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  if (error instanceof InvalidApiKeyError) {
    return NextResponse.json(
      { error: error.message },
      { status: 401 }
    )
  }

  // 403 Forbidden
  if (error instanceof InsufficientPermissionsError) {
    return NextResponse.json(
      { error: error.message },
      { status: 403 }
    )
  }

  // 404 Not Found
  if (
    error instanceof StoryNotFoundError ||
    error instanceof CardNotFoundError ||
    error instanceof ChoiceNotFoundError ||
    error instanceof CharacterNotFoundError ||
    error instanceof CharacterCardNotFoundError ||
    error instanceof AssetNotFoundError ||
    error instanceof CollectionNotFoundError ||
    error instanceof ApiKeyNotFoundError
  ) {
    return NextResponse.json(
      { error: error.message },
      { status: 404 }
    )
  }

  // 422 Unprocessable Entity
  if (
    error instanceof StoryValidationError ||
    error instanceof ImageGenerationError ||
    error instanceof ImageUploadError
  ) {
    return NextResponse.json(
      { error: error.message },
      { status: 422 }
    )
  }

  // 429 Too Many Requests
  if (error instanceof RateLimitExceededError) {
    return NextResponse.json(
      { error: error.message },
      { status: 429 }
    )
  }

  // 500 Internal Server Error
  if (error instanceof DatabaseError) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }

  // Generic error handling for unknown errors
  const errorMessage = error instanceof Error ? error.message : fallbackMessage
  return NextResponse.json(
    { error: errorMessage },
    { status: 500 }
  )
}

/**
 * Create a JSON error response.
 * Convenience function for validation errors and other custom error responses.
 *
 * @example
 * ```ts
 * if (!name || name.length < 3) {
 *   return errorResponse('Name must be at least 3 characters', 400)
 * }
 * ```
 */
export function errorResponse(
  message: string,
  status: number = 400
): NextResponse {
  return NextResponse.json({ error: message }, { status })
}

/**
 * Create a JSON success response.
 * Convenience function for consistent success responses.
 *
 * @example
 * ```ts
 * return successResponse({ user, profile }, 201)
 * ```
 */
export function successResponse<T extends Record<string, unknown>>(
  data: T,
  status: number = 200
): NextResponse {
  return NextResponse.json({ success: true, ...data }, { status })
}
