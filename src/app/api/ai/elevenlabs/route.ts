import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// ElevenLabs configuration
const ELEVENLABS_API_URL = 'https://api.elevenlabs.io/v1'
const VOICE_ID = 'Og9r1xtrwAAzZwUkNjhz' // Specified voice
const MODEL_ID = 'eleven_v3'

interface GenerateAudioRequest {
  text: string
  storyStackId: string
  cardId: string
}

interface GenerateAudioResponse {
  success: boolean
  audioUrl?: string
  error?: string
}

/**
 * Check if ElevenLabs API key is configured
 */
export async function GET(): Promise<NextResponse<{ available: boolean }>> {
  const apiKey = process.env.ELEVENLABS_API_KEY
  return NextResponse.json({ available: !!apiKey })
}

/**
 * POST /api/ai/elevenlabs
 * Generate audio narration from text using ElevenLabs TTS
 *
 * Body:
 * - text: string - The text to convert to speech
 * - storyStackId: string - Story stack ID for storage path
 * - cardId: string - Card ID for storage path
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateAudioResponse>> {
  try {
    // Check for API key
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'ElevenLabs API key not configured' },
        { status: 503 }
      )
    }

    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body: GenerateAudioRequest = await request.json()
    const { text, storyStackId, cardId } = body

    if (!text || !text.trim()) {
      return NextResponse.json(
        { success: false, error: 'Text is required' },
        { status: 400 }
      )
    }

    if (!storyStackId || !cardId) {
      return NextResponse.json(
        { success: false, error: 'storyStackId and cardId are required' },
        { status: 400 }
      )
    }

    // Generate audio with ElevenLabs
    const elevenLabsResponse = await fetch(
      `${ELEVENLABS_API_URL}/text-to-speech/${VOICE_ID}`,
      {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': apiKey,
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: MODEL_ID,
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            style: 0.5,
            use_speaker_boost: true,
          },
          language_code: 'en',
        }),
      }
    )

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('ElevenLabs API error:', errorText)
      return NextResponse.json(
        { success: false, error: `ElevenLabs API error: ${elevenLabsResponse.status}` },
        { status: 500 }
      )
    }

    // Get audio buffer
    const audioBuffer = await elevenLabsResponse.arrayBuffer()

    // Upload to Supabase Storage
    const fileName = `${cardId}-${Date.now()}.mp3`
    const storagePath = `${user.id}/${storyStackId}/audio/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('story-audio')
      .upload(storagePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      })

    if (uploadError) {
      // If bucket doesn't exist, try creating it or use a fallback
      console.error('Storage upload error:', uploadError)

      // Try uploading to a general assets bucket as fallback
      const { error: fallbackError } = await supabase.storage
        .from('assets')
        .upload(`audio/${storagePath}`, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true,
        })

      if (fallbackError) {
        return NextResponse.json(
          { success: false, error: 'Failed to upload audio file' },
          { status: 500 }
        )
      }

      // Get public URL from fallback bucket
      const { data: publicUrlData } = supabase.storage
        .from('assets')
        .getPublicUrl(`audio/${storagePath}`)

      return NextResponse.json({
        success: true,
        audioUrl: publicUrlData.publicUrl,
      })
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('story-audio')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      success: true,
      audioUrl: publicUrlData.publicUrl,
    })
  } catch (error) {
    console.error('Error generating audio:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to generate audio' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/ai/elevenlabs
 * Delete audio file from storage
 *
 * Body:
 * - audioUrl: string - URL of the audio file to delete
 */
export async function DELETE(request: NextRequest): Promise<NextResponse<{ success: boolean; error?: string }>> {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { audioUrl } = body

    if (!audioUrl) {
      return NextResponse.json(
        { success: false, error: 'audioUrl is required' },
        { status: 400 }
      )
    }

    // Extract storage path from URL
    // URLs look like: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
    const urlParts = audioUrl.split('/storage/v1/object/public/')
    if (urlParts.length !== 2) {
      return NextResponse.json(
        { success: false, error: 'Invalid audio URL format' },
        { status: 400 }
      )
    }

    const pathWithBucket = urlParts[1]
    const bucketEndIndex = pathWithBucket.indexOf('/')
    const bucket = pathWithBucket.substring(0, bucketEndIndex)
    const path = pathWithBucket.substring(bucketEndIndex + 1)

    // Delete from storage
    const { error: deleteError } = await supabase.storage
      .from(bucket)
      .remove([path])

    if (deleteError) {
      console.error('Storage delete error:', deleteError)
      return NextResponse.json(
        { success: false, error: 'Failed to delete audio file' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting audio:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete audio' },
      { status: 500 }
    )
  }
}
