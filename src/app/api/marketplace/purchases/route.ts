import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/purchases - Get user's purchases
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const purchases = await marketplaceService.getUserPurchases()

    return NextResponse.json({ success: true, purchases })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch purchases' }, { status: 500 })
  }
}

// POST /api/marketplace/purchases - Record a new purchase
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.assetId) {
      return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 })
    }
    if (!body.paymentIntentId) {
      return NextResponse.json({ error: 'Payment intent ID is required' }, { status: 400 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const purchase = await marketplaceService.recordPurchase(
      body.assetId,
      body.paymentIntentId
    )

    return NextResponse.json({ success: true, purchase }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to record purchase' }, { status: 500 })
  }
}
