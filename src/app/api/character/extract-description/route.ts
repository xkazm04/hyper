import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGroqClient } from '@/lib/llm/groq-client'

/**
 * System prompt for character description extraction
 * Based on char-descriptions-examples.md format
 */
const CHARACTER_EXTRACTION_SYSTEM_PROMPT = `You are an expert at analyzing character images and extracting detailed visual descriptions for use in image generation prompts.

Your goal is to extract a comprehensive character description that can be used to recreate this character consistently across multiple images.

OUTPUT FORMAT - Use these categories (include only those that are visible/relevant):

Face:
- Facial structure and features
- Eyes (color, shape, expression)
- Nose, lips, facial hair if any
- Skin tone and any markings/scars/tattoos
- Expression/demeanor

Hair:
- Style, length, color
- Any distinctive features

Build/Physique:
- Body type, height impression
- Posture and presence

Clothing:
- Main garments with colors and materials
- Layering and style
- Any armor or protective elements

Accessories:
- Jewelry, weapons, pouches, belts
- Any carried items or equipment

Overall Vibe:
- 2-3 lines capturing the character's essence
- Personality hints from visual cues
- Role/archetype suggestions

GUIDELINES:
1. Be specific and descriptive - avoid vague terms
2. Use visual language suitable for image generation
3. Note colors, textures, materials when visible
4. Describe proportions and spatial relationships
5. Capture unique/distinctive features prominently
6. Keep each bullet point concise but informative
7. Total description should be 400-800 characters
8. Output ONLY the structured description, no preamble or explanations`

const CHARACTER_EXTRACTION_PROMPT = `Analyze this character image and extract a detailed visual description following the structured format.

Focus on:
1. All visible physical features
2. Clothing and equipment details  
3. Distinctive characteristics that define this character
4. The overall impression and vibe

Provide the description in the structured category format (Face, Hair, Build/Physique, Clothing, Accessories, Overall Vibe). Only include categories that are clearly visible in the image.`

/**
 * POST /api/character/extract-description
 * Extract character description from an uploaded image using Groq Vision
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

    // Use Groq Vision to extract character description
    const groqClient = getGroqClient()
    
    const result = await groqClient.generateWithVision(
      imageUrl,
      CHARACTER_EXTRACTION_PROMPT,
      CHARACTER_EXTRACTION_SYSTEM_PROMPT
    )

    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || 'Failed to extract character description from image' },
        { status: 500 }
      )
    }

    // Clean up the response
    let extractedDescription = result.response.trim()
    
    // Remove any markdown formatting if present
    extractedDescription = extractedDescription
      .replace(/^```[\w]*\n?/g, '')
      .replace(/\n?```$/g, '')
      .replace(/^Here is the description[^:]*:\s*/i, '')
      .trim()

    return NextResponse.json({
      success: true,
      description: extractedDescription,
      usage: result.usage
    })
  } catch (error) {
    console.error('Error extracting character description:', error)
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract character description' },
      { status: 500 }
    )
  }
}
