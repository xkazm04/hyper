import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/collections/[slug] - Get a collection with its assets
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params

    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    const collection = await marketplaceService.getCollectionBySlug(slug)

    if (!collection) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    const assets = await marketplaceService.getCollectionAssets(collection.id)

    return NextResponse.json({ success: true, collection, assets })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch collection' }, { status: 500 })
  }
}
