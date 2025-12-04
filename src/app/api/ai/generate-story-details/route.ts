import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

// System prompt for generating story name
const NAME_SYSTEM_PROMPT = `You are a creative story naming specialist. Generate a compelling, memorable title for a story based on the provided concept.

Rules:
- The title should be 1-3 words maximum
- It should be evocative and capture the essence of the story
- Avoid generic titles like "The Story" or "Adventure"
- Use strong, memorable words that create intrigue
- Do not include quotation marks or punctuation
- Only respond with the title, nothing else`

// System prompt for generating story description (based on concept.md template)
const DESCRIPTION_SYSTEM_PROMPT = `You are a creative story concept writer. Your task is to transform a brief user idea into a compelling, fully-realized story concept.

OUTPUT: A single paragraph containing exactly 5 sentences that includes:
- Sentence 1: Establish the world/setting and introduce the protagonist with a compelling hook
- Sentence 2: Introduce supporting characters and the primary quest/objective
- Sentence 3: Reveal the antagonist or central conflict/threat
- Sentence 4: Raise the emotional and narrative stakes with a twist or deeper revelation
- Sentence 5: Present the climactic choice or final mystery that drives the story

GUIDELINES:
- Use vivid, specific details (names, places, objects)
- Include sensory and atmospheric elements
- Create narrative tension and moral complexity
- Ensure all elements connect cohesively
- Match tone and tropes to the specified genre
- Make it feel like a complete story arc in miniature
- Only respond with the story concept paragraph, nothing else`

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

    const body = await request.json()
    const { type, userInput, currentName, currentDescription } = body

    if (!type || !['name', 'description', 'both'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "name", "description", or "both"' },
        { status: 400 }
      )
    }

    const result: { name?: string; description?: string } = {}

    // Generate description first if needed (name generation can use it)
    if (type === 'description' || type === 'both') {
      const descriptionPrompt = userInput
        ? `User idea: ${userInput}`
        : currentName
          ? `User idea: A story called "${currentName}"`
          : 'User idea: An exciting adventure story'

      const descriptionResponse = await getLLMCompletion({
        prompt: descriptionPrompt,
        systemPrompt: DESCRIPTION_SYSTEM_PROMPT,
        maxTokens: 500,
        useFastModel: true,
      })

      result.description = descriptionResponse.content.trim()
    }

    // Generate name
    if (type === 'name' || type === 'both') {
      const conceptForName = result.description || currentDescription || userInput || 'An exciting adventure story'

      const namePrompt = `Generate a title for this story concept:\n\n${conceptForName}`

      const nameResponse = await getLLMCompletion({
        prompt: namePrompt,
        systemPrompt: NAME_SYSTEM_PROMPT,
        maxTokens: 50,
        useFastModel: true,
      })

      result.name = nameResponse.content.trim().replace(/^["']|["']$/g, '')
    }

    return NextResponse.json({
      success: true,
      ...result,
    })

  } catch (error) {
    console.error('Error generating story details:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate story details' },
      { status: 500 }
    )
  }
}
