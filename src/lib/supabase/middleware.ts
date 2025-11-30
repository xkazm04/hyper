import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './database.types'

/**
 * Creates a Supabase client for use in Next.js middleware
 * Handles cookie operations with proper middleware response handling
 */
export function createMiddlewareClient(request: NextRequest) {
  // Create initial response that we'll mutate with cookies
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Set cookies on the request for downstream middleware
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          // Create new response with updated request
          response = NextResponse.next({ request })
          // Set cookies on the response for the browser
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  return { supabase, response: () => response }
}
