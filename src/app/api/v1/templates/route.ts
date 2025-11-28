import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { DatabaseError, InvalidApiKeyError, RateLimitExceededError } from '@/lib/types'

// Helper to validate API key from header
async function validateApiKey(request: NextRequest, supabase: any) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new InvalidApiKeyError('Missing or invalid Authorization header')
  }

  const apiKey = authHeader.substring(7)
  const marketplaceService = new MarketplaceService(supabase)

  const validatedKey = await marketplaceService.validateApiKey(apiKey)
  if (!marketplaceService.hasScope(validatedKey, 'read:assets')) {
    throw new InvalidApiKeyError('API key lacks required scope: read:assets')
  }

  return validatedKey
}

// GET /api/v1/templates - List available story templates
export async function GET(request: NextRequest) {
  const startTime = Date.now()
  let apiKeyId: string | null = null

  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    // Validate API key
    const apiKey = await validateApiKey(request, supabase)
    apiKeyId = apiKey.id

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const options = {
      query: searchParams.get('query') || undefined,
      assetType: 'story_template' as const,
      category: searchParams.get('category') as any || undefined,
      tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,
      isFree: searchParams.get('isFree') === 'true' ? true :
              searchParams.get('isFree') === 'false' ? false : undefined,
      sortBy: searchParams.get('sortBy') as any || 'downloads',
      sortOrder: searchParams.get('sortOrder') as any || 'desc',
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: Math.min(parseInt(searchParams.get('pageSize') || '20'), 100),
    }

    const result = await marketplaceService.searchAssets(options)

    // Log API usage
    const responseTime = Date.now() - startTime
    await marketplaceService.logApiUsage(
      apiKeyId,
      '/api/v1/templates',
      'GET',
      undefined,
      200,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    // Return template-specific response format
    const templates = result.assets.map(asset => ({
      id: asset.id,
      slug: asset.slug,
      name: asset.name,
      description: asset.description,
      version: asset.version,
      category: asset.category,
      tags: asset.tags,
      thumbnailUrl: asset.thumbnailUrl,
      previewImages: asset.previewImages,
      isFree: asset.isFree,
      price: asset.price,
      licenseType: asset.licenseType,
      rating: asset.rating,
      ratingCount: asset.ratingCount,
      downloads: asset.downloads,
      metadata: asset.storyTemplateData?.metadata || null,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    }))

    return NextResponse.json({
      success: true,
      templates,
      pagination: {
        page: result.page,
        pageSize: result.pageSize,
        total: result.total,
        totalPages: result.totalPages,
      },
    })
  } catch (error) {
    if (error instanceof InvalidApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}
