import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/assets - Search/list marketplace assets
export async function GET(request: NextRequest) {
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
      page: parseInt(searchParams.get('page') || '1'),
      pageSize: parseInt(searchParams.get('pageSize') || '20'),
    }

    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)
    const result = await marketplaceService.searchAssets(options)

    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to search assets' }, { status: 500 })
  }
}

// POST /api/marketplace/assets - Create a new asset
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
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }
    if (!body.assetType) {
      return NextResponse.json({ error: 'Asset type is required' }, { status: 400 })
    }
    if (!body.category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const asset = await marketplaceService.createAsset({
      name: body.name.trim(),
      description: body.description,
      assetType: body.assetType,
      thumbnailUrl: body.thumbnailUrl,
      previewImages: body.previewImages,
      characterData: body.characterData,
      promptTemplate: body.promptTemplate,
      tags: body.tags,
      category: body.category,
      licenseType: body.licenseType,
      isFree: body.isFree,
      price: body.price,
      royaltyPercentage: body.royaltyPercentage,
    })

    return NextResponse.json({ success: true, asset }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create asset' }, { status: 500 })
  }
}
