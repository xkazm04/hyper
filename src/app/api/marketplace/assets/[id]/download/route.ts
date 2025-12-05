import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { AssetNotFoundError, DatabaseError } from '@/lib/types'

// POST /api/marketplace/assets/[id]/download - Download an asset
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

    const body = await request.json().catch(() => ({}))
    const storyStackId = body.storyStackId

    const marketplaceService = new MarketplaceService(supabase)
    const asset = await marketplaceService.downloadAsset(id, storyStackId)

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to download asset' }, { status: 500 })
  }
}
