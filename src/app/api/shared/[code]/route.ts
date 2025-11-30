import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { SharedBundlesService } from '@/lib/services/story/sharedBundles'

/**
 * GET /api/shared/[code]
 * Retrieve a shared story bundle by its share code (public access)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params

    if (!code || code.length < 6) {
      return NextResponse.json(
        { error: 'Invalid share code' },
        { status: 400 }
      )
    }

    // Create supabase client (works for both authenticated and anonymous)
    const supabase = await createServerSupabaseClient()
    const sharedBundlesService = new SharedBundlesService(supabase)

    // Get the shared bundle
    const sharedBundle = await sharedBundlesService.getSharedBundleByCode(code)

    if (!sharedBundle) {
      return NextResponse.json(
        { error: 'Shared story not found or has expired' },
        { status: 404 }
      )
    }

    // Increment view count (fire and forget)
    sharedBundlesService.incrementViewCount(code).catch(() => {
      // Ignore view count errors
    })

    return NextResponse.json({
      success: true,
      shareCode: sharedBundle.shareCode,
      storyName: sharedBundle.storyName,
      storyDescription: sharedBundle.storyDescription,
      cardCount: sharedBundle.cardCount,
      choiceCount: sharedBundle.choiceCount,
      characterCount: sharedBundle.characterCount,
      bundle: sharedBundle.bundleData,
      createdAt: sharedBundle.createdAt,
    })
  } catch (error) {
    console.error('Error retrieving shared bundle:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve shared story' },
      { status: 500 }
    )
  }
}
