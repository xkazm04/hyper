import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { AssetNotFoundError, DatabaseError } from '@/lib/types'

// GET /api/marketplace/assets/[id] - Get a single asset
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)
    const asset = await marketplaceService.getAsset(id)

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch asset' }, { status: 500 })
  }
}

// PATCH /api/marketplace/assets/[id] - Update an asset
export async function PATCH(
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

    const body = await request.json()
    const asset = await marketplaceService.updateAsset(id, body)

    return NextResponse.json({ success: true, asset })
  } catch (error) {
    if (error instanceof AssetNotFoundError) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 })
  }
}

// DELETE /api/marketplace/assets/[id] - Delete an asset
export async function DELETE(
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

    await marketplaceService.deleteAsset(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 })
  }
}
