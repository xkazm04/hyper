import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { DatabaseError } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET /api/marketplace/assets/[id]/versions - Get all versions of an asset
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const marketplaceService = new MarketplaceService(supabase)

    const versions = await marketplaceService.getAssetVersions(id)

    return NextResponse.json({ success: true, versions })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 })
  }
}

// POST /api/marketplace/assets/[id]/versions - Create a new version
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.version) {
      return NextResponse.json({ error: 'Version is required' }, { status: 400 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const version = await marketplaceService.createVersion(
      id,
      body.version,
      body.versionNotes
    )

    return NextResponse.json({ success: true, version }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create version' }, { status: 500 })
  }
}
