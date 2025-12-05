import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { authenticateApiKey, logApiRequest } from '@/lib/services/api-auth'
import { DatabaseError } from '@/lib/types'

/**
 * Public API - GET /api/v1/collections
 *
 * Get all curated collections.
 * Requires API key with 'read:assets' scope.
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Authenticate
  const auth = await authenticateApiKey(request, 'read:assets')
  if (!auth.success) {
    return auth.response
  }

  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)
    const collections = await marketplaceService.getCollections()

    await logApiRequest(auth.apiKey, request, undefined, 200)

    return NextResponse.json({
      data: collections.map(collection => ({
        id: collection.id,
        name: collection.name,
        description: collection.description,
        slug: collection.slug,
        thumbnailUrl: collection.thumbnailUrl,
        collectionType: collection.collectionType,
      })),
      meta: {
        responseTime: Date.now() - startTime,
        count: collections.length,
      },
    })
  } catch (error) {
    await logApiRequest(auth.apiKey, request, undefined, 500)

    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
