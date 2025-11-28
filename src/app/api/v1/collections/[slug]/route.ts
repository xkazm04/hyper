import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { authenticateApiKey, logApiRequest } from '@/lib/services/api-auth'
import { DatabaseError } from '@/lib/types'

/**
 * Public API - GET /api/v1/collections/[slug]
 *
 * Get a curated collection with its assets by slug.
 * Requires API key with 'read:assets' scope.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const startTime = Date.now()
  const { slug } = await params

  // Authenticate
  const auth = await authenticateApiKey(request, 'read:assets')
  if (!auth.success) {
    return auth.response
  }

  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    const collection = await marketplaceService.getCollectionBySlug(slug)

    if (!collection) {
      await logApiRequest(auth.apiKey, request, undefined, 404)
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const assets = await marketplaceService.getCollectionAssets(collection.id)

    await logApiRequest(auth.apiKey, request, undefined, 200)

    return NextResponse.json({
      data: {
        collection: {
          id: collection.id,
          name: collection.name,
          description: collection.description,
          slug: collection.slug,
          thumbnailUrl: collection.thumbnailUrl,
          collectionType: collection.collectionType,
        },
        assets: assets.map(asset => ({
          id: asset.id,
          name: asset.name,
          description: asset.description,
          slug: asset.slug,
          assetType: asset.assetType,
          category: asset.category,
          tags: asset.tags,
          thumbnailUrl: asset.thumbnailUrl,
          licenseType: asset.licenseType,
          isFree: asset.isFree,
          price: asset.price,
          downloads: asset.downloads,
          rating: asset.rating,
          ratingCount: asset.ratingCount,
        })),
      },
      meta: {
        responseTime: Date.now() - startTime,
        assetCount: assets.length,
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
