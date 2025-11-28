import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { authenticateApiKey, logApiRequest } from '@/lib/services/api-auth'
import { DatabaseError } from '@/lib/types'

/**
 * Public API - GET /api/v1/assets
 *
 * Search and list marketplace assets for external services.
 * Requires API key with 'read:assets' scope.
 *
 * Query Parameters:
 * - query: Search term (optional)
 * - assetType: character | prompt_template | avatar_set | character_pack (optional)
 * - category: fantasy | sci-fi | modern | historical | horror | anime | realistic | cartoon | other (optional)
 * - tags: Comma-separated list of tags (optional)
 * - licenseType: free | attribution | non-commercial | commercial | exclusive (optional)
 * - isFree: true | false (optional)
 * - isFeatured: true (optional)
 * - isCurated: true (optional)
 * - sortBy: downloads | rating | newest | price (default: downloads)
 * - sortOrder: asc | desc (default: desc)
 * - page: Page number (default: 1)
 * - pageSize: Results per page, max 100 (default: 20)
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  // Authenticate
  const auth = await authenticateApiKey(request, 'read:assets')
  if (!auth.success) {
    return auth.response
  }

  try {
    const searchParams = request.nextUrl.searchParams

    const options = {
      query: searchParams.get('query') || undefined,
      assetType: searchParams.get('assetType') as any || undefined,
      category: searchParams.get('category') as any || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      licenseType: searchParams.get('licenseType') as any || undefined,
      isFree: searchParams.get('isFree') === 'true' ? true :
              searchParams.get('isFree') === 'false' ? false : undefined,
      isFeatured: searchParams.get('isFeatured') === 'true' ? true : undefined,
      isCurated: searchParams.get('isCurated') === 'true' ? true : undefined,
      sortBy: searchParams.get('sortBy') as any || 'downloads',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      pageSize: Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '20'))),
    }

    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)
    const result = await marketplaceService.searchAssets(options)

    // Log the request
    await logApiRequest(auth.apiKey, request, undefined, 200)

    // Format response for public API
    return NextResponse.json({
      data: result.assets.map(asset => ({
        id: asset.id,
        name: asset.name,
        description: asset.description,
        slug: asset.slug,
        assetType: asset.assetType,
        category: asset.category,
        tags: asset.tags,
        thumbnailUrl: asset.thumbnailUrl,
        previewImages: asset.previewImages,
        licenseType: asset.licenseType,
        isFree: asset.isFree,
        price: asset.price,
        downloads: asset.downloads,
        rating: asset.rating,
        ratingCount: asset.ratingCount,
        createdAt: asset.createdAt,
        updatedAt: asset.updatedAt,
      })),
      pagination: {
        total: result.total,
        page: result.page,
        pageSize: result.pageSize,
        totalPages: result.totalPages,
      },
      meta: {
        responseTime: Date.now() - startTime,
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
