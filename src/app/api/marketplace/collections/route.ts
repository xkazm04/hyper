import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/collections - Get all active collections
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)
    const collections = await marketplaceService.getCollections()

    return NextResponse.json({ success: true, collections })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 })
  }
}

// POST /api/marketplace/collections - Create a new collection (curators only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add curator role check here
    // For now, any authenticated user can create collections

    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return NextResponse.json({ error: 'Name is required (min 2 characters)' }, { status: 400 })
    }
    if (!body.description || typeof body.description !== 'string') {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 })
    }
    if (!body.collectionType) {
      return NextResponse.json({ error: 'Collection type is required' }, { status: 400 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const collection = await marketplaceService.createCollection({
      name: body.name.trim(),
      description: body.description,
      thumbnailUrl: body.thumbnailUrl,
      collectionType: body.collectionType,
      displayOrder: body.displayOrder,
    })

    return NextResponse.json({ success: true, collection }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 })
  }
}
