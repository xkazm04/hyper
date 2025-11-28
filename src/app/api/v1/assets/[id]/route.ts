import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { authenticateApiKey, logApiRequest } from '@/lib/services/api-auth'
import { DatabaseError } from '@/lib/types'

/**
 * Public API - GET /api/v1/assets/[id]
 *
 * Get a single asset by ID for external services.
 * Requires API key with 'read:assets' scope.
 *
 * Returns full asset details including character data or prompt template.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  // Authenticate
  const auth = await authenticateApiKey(request, 'read:assets')
  if (!auth.success) {
    return auth.response
  }

  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)
    const asset = await marketplaceService.getAsset(id)

    if (!asset) {
      await logApiRequest(auth.apiKey, request, id, 404)
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    // Only return published and approved assets
    if (!asset.isPublished || asset.approvalStatus !== 'approved') {
      await logApiRequest(auth.apiKey, request, id, 404)
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    await logApiRequest(auth.apiKey, request, id, 200)

    return NextResponse.json({
      data: {
        id: asset.id,
        name: asset.name,
        description: asset.description,
        slug: asset.slug,
        assetType: asset.assetType,
        category: asset.category,
        tags: asset.tags,
        thumbnailUrl: asset.thumbnailUrl,
        previewImages: asset.previewImages,
        characterData: asset.characterData,
        promptTemplate: asset.promptTemplate,
        licenseType: asset.licenseType,
        isFree: asset.isFree,
        price: asset.price,
        downloads: asset.downloads,
        rating: asset.rating,
        ratingCount: asset.ratingCount,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      },
      meta: {
        responseTime: Date.now() - startTime,
      },
    })
  } catch (error) {
    await logApiRequest(auth.apiKey, request, id, 500)

    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
