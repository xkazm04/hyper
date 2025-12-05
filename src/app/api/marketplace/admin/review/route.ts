import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { AssetNotFoundError, DatabaseError } from '@/lib/types'

// GET /api/marketplace/admin/review - Get assets pending review
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin/curator role check here
    // For now, any authenticated user can view pending reviews

    const marketplaceService = new MarketplaceService(supabase)
    const assets = await marketplaceService.getPendingReviewAssets()

    return NextResponse.json({ success: true, assets })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch pending reviews' }, { status: 500 })
  }
}

// POST /api/marketplace/admin/review - Review an asset
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Add admin/curator role check here

    const body = await request.json()

    // Validate required fields
    if (!body.assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }

    const validStatuses = ['approved', 'rejected', 'needs_changes']
    if (!body.status || !validStatuses.includes(body.status)) {
      return NextResponse.json({ error: 'Valid status is required (approved, rejected, needs_changes)' }, { status: 400 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const asset = await marketplaceService.reviewAsset(body.assetId, body.status, body.notes)

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to review asset' }, { status: 500 })
  }
}
