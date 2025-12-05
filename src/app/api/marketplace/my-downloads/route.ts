import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { MarketplaceService } from '@/lib/services/marketplace/index'
import { DatabaseError } from '@/lib/types'

// GET /api/marketplace/my-downloads - Get current user's download history
export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const marketplaceService = new MarketplaceService(supabase)
    const downloads = await marketplaceService.getUserDownloads()

    return NextResponse.json({ success: true, downloads })
  } catch (error) {
    if (error instanceof DatabaseError) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ error: 'Failed to fetch your downloads' }, { status: 500 })
  }
}
