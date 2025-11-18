import { NextRequest, NextResponse } from 'next/server'
import { getAICompletion } from '@/lib/services/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    // Check for demo mode cookie
    const demoMode = request.cookies.get('demoMode')?.value === 'true'
    
    // Verify authentication (skip for demo mode)
    if (!demoMode) {
      const supabase = await createServerSupabaseClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    const body = await request.json()
    const { prompt, systemPrompt, maxTokens } = body

    const completion = await getAICompletion({
      prompt,
      systemPrompt,
      maxTokens,
    })

    return NextResponse.json({ completion })
  } catch (error: any) {
    console.error('AI completion error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to get AI completion' },
      { status: 500 }
    )
  }
}
