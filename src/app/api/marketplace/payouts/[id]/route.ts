import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { DatabaseError } from '@/lib/types'

interface RouteParams {
  params: Promise<{ id: string }>
}

// DELETE /api/marketplace/payouts/[id] - Cancel a pending payout request
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    await marketplaceService.cancelPayoutRequest(id)

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to cancel payout' }, { status: 500 })
  }
}
