import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/payouts - Get creator's payout requests
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const payouts = await marketplaceService.getPayoutRequests()

    return NextResponse.json({ success: true, payouts })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch payouts' }, { status: 500 })
  }
}

// POST /api/marketplace/payouts - Create a payout request
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    if (!body.amount || body.amount <= 0) {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 })
    }
    if (!body.payoutMethod) {
      return NextResponse.json({ error: 'Payout method is required' }, { status: 400 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const payout = await marketplaceService.createPayoutRequest({
      amount: body.amount,
      payoutMethod: body.payoutMethod,
      payoutDetails: body.payoutDetails,
    })

    return NextResponse.json({ success: true, payout }, { status: 201 })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to create payout request' }, { status: 500 })
  }
}
