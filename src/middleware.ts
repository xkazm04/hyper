import { NextResponse, type NextRequest } from 'next/server'
import { createMiddlewareClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Check for demo mode cookie
  const demoMode = request.cookies.get('demoMode')?.value === 'true'

  // If in demo mode, allow access without authentication
  if (demoMode) {
    return NextResponse.next({ request })
  }

  // Create centralized middleware client
  const { supabase, response } = createMiddlewareClient(request)

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard and editor routes
  if (!user && (request.nextUrl.pathname.startsWith('/dashboard') ||
                request.nextUrl.pathname.startsWith('/editor'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return response()
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/editor/:path*',
  ],
}
