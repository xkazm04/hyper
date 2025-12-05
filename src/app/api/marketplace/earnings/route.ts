import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/earnings - Get creator's earnings and balance
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marketplaceService = new MarketplaceService(supabase)

    const [earnings, balance] = await Promise.all([
      marketplaceService.getCreatorEarnings(),
      marketplaceService.getCreatorBalance(),
    ])

    return NextResponse.json({ success: true, earnings, balance })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch earnings' }, { status: 500 })
  }
}
