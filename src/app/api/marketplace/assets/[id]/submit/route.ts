import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { AssetNotFoundError, DatabaseError } from '@/lib/types'

// POST /api/marketplace/assets/[id]/submit - Submit an asset for review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const marketplaceService = new MarketplaceService(supabase)
    const existingAsset = await marketplaceService.getAsset(id)

    if (!existingAsset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    if (existingAsset.creatorId !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Validate asset is ready for submission
    if (!existingAsset.thumbnailUrl) {
      return NextResponse.json({ error: 'Asset must have a thumbnail before submission' }, { status: 400 })
    }

    if (existingAsset.approvalStatus !== 'draft' && existingAsset.approvalStatus !== 'needs_changes') {
      return NextResponse.json({ error: 'Asset is already submitted or approved' }, { status: 400 })
    }

    const asset = await marketplaceService.submitForReview(id)

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to submit asset for review' }, { status: 500 })
  }
}
