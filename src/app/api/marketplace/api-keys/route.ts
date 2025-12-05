import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/api-keys - Get user's API keys
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const apiKeys = await marketplaceService.getApiKeys()

    return NextResponse.json({ success: true, apiKeys })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch API keys' }, { status: 500 })
  }
}

// POST /api/marketplace/api-keys - Create a new API key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 400 })
    }

    // Validate scopes
    const validScopes = ['read:assets', 'embed:assets', 'download:assets']
    if (body.scopes) {
      const invalidScopes = body.scopes.filter((s: string) => !validScopes.includes(s))
      if (invalidScopes.length > 0) {
        return NextResponse.json({ error: `Invalid scopes: ${invalidScopes.join(', ')}` }, { status: 400 })
      }
    }

    const marketplaceService = new MarketplaceService(supabase)
    const { apiKey, rawKey } = await marketplaceService.createApiKey({
      name: body.name.trim(),
      scopes: body.scopes,
      rateLimit: body.rateLimit,
      expiresAt: body.expiresAt,
    })

    // Return the raw key only once during creation
    return NextResponse.json({
      success: true,
      apiKey,
      rawKey, // This is the only time the full key is returned
      warning: 'Save this key securely. It will not be shown again.',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create API key' }, { status: 500 })
  }
}
