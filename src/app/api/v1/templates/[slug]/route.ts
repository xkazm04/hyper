import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { DatabaseError, InvalidApiKeyError, RateLimitExceededError, AssetNotFoundError } from '@/lib/types'

interface RouteParams {
  params: Promise<{ slug: string }>
}

// Helper to validate API key from header
async function validateApiKey(request: NextRequest, supabase: any, requiredScope: string) {
  const authHeader = request.headers.get('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new InvalidApiKeyError('Missing or invalid Authorization header')
  }

  const apiKey = authHeader.substring(7)
  const marketplaceService = new MarketplaceService(supabase)

  const validatedKey = await marketplaceService.validateApiKey(apiKey)
  if (!marketplaceService.hasScope(validatedKey, requiredScope)) {
    throw new InvalidApiKeyError(`API key lacks required scope: ${requiredScope}`)
  }

  return validatedKey
}

// GET /api/v1/templates/[slug] - Get a specific template by slug
export async function GET(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()
  let apiKeyId: string | null = null

  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    // Validate API key
    const apiKey = await validateApiKey(request, supabase, 'read:assets')
    apiKeyId = apiKey.id

    // Get the asset by slug
    const asset = await marketplaceService.getAssetBySlug(slug)

    if (!asset) {
      throw new AssetNotFoundError(slug)
    }

    // Ensure it's a story template
    if (asset.assetType !== 'story_template') {
      return NextResponse.json({ error: 'Asset is not a story template' }, { status: 400 })
    }

    // Log API usage
    const responseTime = Date.now() - startTime
    await marketplaceService.logApiUsage(
      apiKeyId,
      `/api/v1/templates/${slug}`,
      'GET',
      asset.id,
      200,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    // Return template-specific response format
    const template = {
      id: asset.id,
      slug: asset.slug,
      name: asset.name,
      description: asset.description,
      version: asset.version,
      versionNotes: asset.versionNotes,
      category: asset.category,
      tags: asset.tags,
      thumbnailUrl: asset.thumbnailUrl,
      previewImages: asset.previewImages,
      demoUrl: asset.demoUrl,
      documentation: asset.documentation,
      isFree: asset.isFree,
      price: asset.price,
      licenseType: asset.licenseType,
      rating: asset.rating,
      ratingCount: asset.ratingCount,
      downloads: asset.downloads,
      compatibilityInfo: asset.compatibilityInfo,
      metadata: asset.storyTemplateData?.metadata || null,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    }

    return NextResponse.json({ success: true, template })
  } catch (error) {
    if (error instanceof InvalidApiKeyError) {
      return NextResponse.json({ error: error.message }, { status: 401 })
    }
    if (error instanceof RateLimitExceededError) {
      return NextResponse.json({ error: error.message }, { status: 429 })
    }
    if (error instanceof AssetNotFoundError) {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch template' }, { status: 500 })
  }
}
