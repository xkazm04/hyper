import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { StoryService } from '@/lib/services/story'
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

// POST /api/v1/templates/[slug]/import - Import a template into user's account
export async function POST(request: NextRequest, { params }: RouteParams) {
  const startTime = Date.now()
  let apiKeyId: string | null = null

  try {
    const { slug } = await params
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    // Validate API key with download scope
    const apiKey = await validateApiKey(request, supabase, 'download:assets')
    apiKeyId = apiKey.id

    // Get user from API key
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Could not identify user from API key' }, { status: 401 })
    }

    // Get the asset by slug
    const asset = await marketplaceService.getAssetBySlug(slug)

    if (!asset) {
      throw new AssetNotFoundError(slug)
    }

    // Ensure it's a story template
    if (asset.assetType !== 'story_template') {
      return NextResponse.json({ error: 'Asset is not a story template' }, { status: 400 })
    }

    // Check if user has access (free or purchased)
    if (!asset.isFree) {
      const hasPurchased = await marketplaceService.hasUserPurchased(asset.id)
      if (!hasPurchased) {
        return NextResponse.json(
          { error: 'You must purchase this template before importing' },
          { status: 402 }
        )
      }
    }

    // Parse request body for customization options
    const body = await request.json().catch(() => ({}))
    const customTitle = body.title || `${asset.name} (Imported)`

    // Get template data
    const templateData = asset.storyTemplateData
    if (!templateData) {
      return NextResponse.json({ error: 'Template data not available' }, { status: 400 })
    }

    // Create story stack from template
    const storyService = new StoryService(supabase)

    // Create the story stack
    const storyStack = await storyService.createStoryStack({
      name: customTitle,
      description: templateData.storyStack.description || undefined,
    })

    // Create a mapping for old card IDs to new card IDs
    const cardIdMapping: Record<string, string> = {}

    // Create all story cards
    for (const cardData of templateData.storyCards) {
      const newCard = await storyService.createStoryCard({
        storyStackId: storyStack.id,
        title: cardData.title,
        content: cardData.content,
        imageUrl: cardData.imageUrl,
        imagePrompt: cardData.imagePrompt,
      })
      cardIdMapping[cardData.id] = newCard.id
    }

    // Update firstCardId with the new ID
    if (templateData.storyStack.firstCardId) {
      const newFirstCardId = cardIdMapping[templateData.storyStack.firstCardId]
      if (newFirstCardId) {
        await storyService.updateStoryStack(storyStack.id, {
          firstCardId: newFirstCardId,
        })
      }
    }

    // Create all choices with updated card IDs
    for (const choiceData of templateData.choices) {
      const newStoryCardId = cardIdMapping[choiceData.storyCardId]
      const newTargetCardId = choiceData.targetCardId
        ? cardIdMapping[choiceData.targetCardId]
        : null

      // Only create choice if we have both source card and target card
      if (newStoryCardId && newTargetCardId) {
        await storyService.createChoice({
          storyCardId: newStoryCardId,
          label: choiceData.label,
          targetCardId: newTargetCardId,
        })
      }
    }

    // Record the download
    await marketplaceService.downloadAsset(asset.id, storyStack.id)

    // Log API usage
    const responseTime = Date.now() - startTime
    await marketplaceService.logApiUsage(
      apiKeyId,
      `/api/v1/templates/${slug}/import`,
      'POST',
      asset.id,
      201,
      responseTime,
      request.headers.get('x-forwarded-for') || undefined,
      request.headers.get('user-agent') || undefined
    )

    return NextResponse.json({
      success: true,
      message: 'Template imported successfully',
      storyStack: {
        id: storyStack.id,
        name: storyStack.name,
        cardCount: templateData.storyCards.length,
        choiceCount: templateData.choices.length,
      },
    }, { status: 201 })
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
    console.error('Template import error:', error)
    return NextResponse.json({ error: 'Failed to import template' }, { status: 500 })
  }
}
