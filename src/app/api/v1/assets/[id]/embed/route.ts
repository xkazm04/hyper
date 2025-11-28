import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { authenticateApiKey, logApiRequest } from '@/lib/services/api-auth'
import { DatabaseError } from '@/lib/types'

/**
 * Public API - GET /api/v1/assets/[id]/embed
 *
 * Get an asset in a format optimized for embedding into stacks.
 * Requires API key with 'embed:assets' scope.
 *
 * This returns the asset data in a format that can be directly
 * used to create characters or apply prompt templates in a stack.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  // Authenticate with embed scope
  const auth = await authenticateApiKey(request, 'embed:assets')
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

    // Format for embedding based on asset type
    let embedData: any = {
      assetId: asset.id,
      assetType: asset.assetType,
      name: asset.name,
      licenseType: asset.licenseType,
    }

    switch (asset.assetType) {
      case 'character':
        if (asset.characterData) {
          embedData.character = {
            name: asset.characterData.name,
            appearance: asset.characterData.appearance,
            imageUrls: asset.characterData.imageUrls,
            imagePrompts: asset.characterData.imagePrompts,
            avatarUrl: asset.characterData.avatarUrl,
            avatarPrompt: asset.characterData.avatarPrompt,
          }
        }
        break

      case 'prompt_template':
        if (asset.promptTemplate) {
          embedData.promptTemplate = {
            template: asset.promptTemplate.template,
            variables: asset.promptTemplate.variables,
            category: asset.promptTemplate.category,
            style: asset.promptTemplate.style,
          }
        }
        break

      case 'avatar_set':
        if (asset.characterData) {
          embedData.avatars = {
            imageUrls: asset.characterData.imageUrls,
            imagePrompts: asset.characterData.imagePrompts,
          }
        }
        break

      case 'character_pack':
        // For packs, include both character data and any templates
        if (asset.characterData) {
          embedData.characters = [{
            name: asset.characterData.name,
            appearance: asset.characterData.appearance,
            imageUrls: asset.characterData.imageUrls,
            imagePrompts: asset.characterData.imagePrompts,
            avatarUrl: asset.characterData.avatarUrl,
            avatarPrompt: asset.characterData.avatarPrompt,
          }]
        }
        if (asset.promptTemplate) {
          embedData.promptTemplates = [asset.promptTemplate]
        }
        break
    }

    return NextResponse.json({
      data: embedData,
      meta: {
        responseTime: Date.now() - startTime,
        attribution: asset.licenseType === 'attribution' ?
          `Created by ${asset.creatorId}. Asset: ${asset.name}` : null,
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

/**
 * Public API - POST /api/v1/assets/[id]/embed
 *
 * Download/use an asset for embedding (tracks usage).
 * Requires API key with 'download:assets' scope.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id } = await params

  // Authenticate with download scope
  const auth = await authenticateApiKey(request, 'download:assets')
  if (!auth.success) {
    return auth.response
  }

  try {
    const body = await request.json().catch(() => ({}))
    const storyStackId = body.storyStackId

    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    // This will increment download count and track the download
    const asset = await marketplaceService.downloadAsset(id, storyStackId)

    await logApiRequest(auth.apiKey, request, id, 200)

    // Format for embedding based on asset type
    let embedData: any = {
      assetId: asset.id,
      assetType: asset.assetType,
      name: asset.name,
      licenseType: asset.licenseType,
      downloaded: true,
    }

    if (asset.assetType === 'character' && asset.characterData) {
      embedData.character = asset.characterData
    } else if (asset.assetType === 'prompt_template' && asset.promptTemplate) {
      embedData.promptTemplate = asset.promptTemplate
    }

    return NextResponse.json({
      data: embedData,
      meta: {
        responseTime: Date.now() - startTime,
        newDownloadCount: asset.downloads,
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
