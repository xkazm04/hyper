import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getGroqClient } from '@/lib/llm/groq-client'

/**
 * System prompt for scene image breakdown
 * Based on card_image_breakdown.md format
 */
const SCENE_BREAKDOWN_SYSTEM_PROMPT = `You are an expert art director analyzing images for the purpose of recreating them via AI image generation.

Your task is to break down the visual elements of a scene image into a structured description that can be used to recreate it or inspire new similar scenes.

OUTPUT FORMAT - Use these specific headers:

**Artistic Style & Medium:**
Describe the visual aesthetic, textures, materials rendered, color palette, and line work style.

**Key Subjects:**
Identify the main characters or objects, detailing their appearance, clothing/armor, mounts, and specific poses or expressions.

**Action & Composition:**
Describe what is happening in the scene, the movement, flow, and how the elements are arranged within the frame.

**Environment & Background:**
Describe the setting, lighting, and how negative space is utilized.

**Specific Details:**
Note any unique elements, symbols, or crucial textures that define the image's character.

GUIDELINES:
1. Be specific and descriptive - avoid vague terms
2. Use visual language suitable for image generation
3. Note colors, textures, materials when visible
4. Capture the mood and atmosphere
5. Keep each section concise but informative
6. Total description should be 600-1200 characters
7. Output ONLY the structured description, no preamble or explanations`

const SCENE_BREAKDOWN_PROMPT = `Analyze this scene image and extract a detailed visual breakdown following the structured format.

Focus on:
1. The artistic style and rendering technique
2. Main subjects and their details
3. The action and composition
4. Environment and atmosphere
5. Unique defining details

Provide the breakdown using the headers: Artistic Style & Medium, Key Subjects, Action & Composition, Environment & Background, Specific Details.`

/**
 * POST /api/ai/scene-breakdown
 * Extract scene description from an image using Groq Vision
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

    // Use Groq Vision to extract scene breakdown
    const groqClient = getGroqClient()

    const result = await groqClient.generateWithVision(
      imageUrl,
      SCENE_BREAKDOWN_PROMPT,
      SCENE_BREAKDOWN_SYSTEM_PROMPT
    )

    if (!result.success || !result.response) {
      return NextResponse.json(
        { error: result.error || 'Failed to extract scene breakdown from image' },
        { status: 500 }
      )
    }

    // Clean up the response
    let extractedBreakdown = result.response.trim()

    // Remove any markdown code block formatting if present
    extractedBreakdown = extractedBreakdown
      .replace(/^```[\w]*\n?/g, '')
      .replace(/\n?```$/g, '')
      .replace(/^Here is the (?:breakdown|description)[^:]*:\s*/i, '')
      .trim()

    return NextResponse.json({
      success: true,
      breakdown: extractedBreakdown,
      usage: result.usage
    })
  } catch (error) {
    console.error('Error extracting scene breakdown:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to extract scene breakdown' },
      { status: 500 }
    )
  }
}
