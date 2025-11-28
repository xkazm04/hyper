import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGroqClient } from '@/lib/llm/groq-client'
import { 
  ART_STYLE_EXTRACTION_PROMPT, 
  ART_STYLE_EXTRACTION_SYSTEM_PROMPT 
} from '@/app/features/editor/story/sub_Story/lib/artStyleService'

/**
 * POST /api/art-style/extract
 * Extract art style from an uploaded image using Groq Vision
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { imageUrl } = body

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      )
    }

    // Validate image URL format (base64 data URL or valid URL)
    const isValidFormat = imageUrl.startsWith('data:image/') || 
                          imageUrl.startsWith('http://') || 
                          imageUrl.startsWith('https://')
    
    if (!isValidFormat) {
      return NextResponse.json(
        { error: 'Invalid image URL format. Must be a data URL or HTTP(S) URL.' },
        { status: 400 }
      )
    }

    // Use Groq Vision to extract art style
    const groqClient = getGroqClient()
    
    const result = await groqClient.generateWithVision(
      imageUrl,
      ART_STYLE_EXTRACTION_PROMPT,
      ART_STYLE_EXTRACTION_SYSTEM_PROMPT
    )

    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || 'Failed to extract art style from image' },
        { status: 500 }
      )
    }

    // Parse the structured response to extract only the prompt
    let extractedPrompt = result.response.trim()
    
    // Extract content between <STYLE_PROMPT> tags if present
    const stylePromptMatch = extractedPrompt.match(/<STYLE_PROMPT>([\s\S]*?)<\/STYLE_PROMPT>/i)
    if (stylePromptMatch) {
      extractedPrompt = stylePromptMatch[1].trim()
    } else {
      // Fallback: try to extract prompt from common LLM response patterns
      // Pattern: "Here is a prompt..." followed by quoted text
      const quotedMatch = extractedPrompt.match(/["']([^"']{50,500})["']/)
      if (quotedMatch) {
        extractedPrompt = quotedMatch[1].trim()
      } else {
        // Remove any markdown formatting if present
        extractedPrompt = extractedPrompt
          .replace(/^```[\w]*\n?/g, '')
          .replace(/\n?```$/g, '')
          .replace(/^\*\*/g, '')
          .replace(/\*\*$/g, '')
          .replace(/^Here is a prompt[^:]*:\s*/i, '')
          .trim()
      }
    }
    
    // Enforce 500 character limit
    if (extractedPrompt.length > 500) {
      extractedPrompt = extractedPrompt.substring(0, 497) + '...'
    }

    return NextResponse.json({
      success: true,
      prompt: extractedPrompt,
      usage: result.usage
    })
  } catch (error) {
    console.error('Error extracting art style:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract art style' },
      { status: 500 }
    )
  }
}
