import { NextRequest, NextResponse } from 'next/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

interface CardContext {
  id: string
  title: string
  content: string
}

interface PredecessorContext {
  card: CardContext
  choiceLabel: string
}

interface GenerateChoicesRequest {
  currentCard: CardContext
  predecessors: PredecessorContext[]
  existingChoices?: string[]
}

interface GeneratedChoice {
  label: string
  description: string
}

/**
 * POST /api/ai/generate-choices
 * Generate choice suggestions based on story context
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateChoicesRequest = await request.json()
    const { currentCard, predecessors, existingChoices = [] } = body

    // Build context from story progression
    let contextPrompt = ''

    // Add predecessors (story so far)
    if (predecessors.length > 0) {
      contextPrompt += 'STORY PROGRESSION (cards leading to current scene):\n'
      for (const pred of predecessors) {
        contextPrompt += `\n--- "${pred.card.title}" ---\n`
        contextPrompt += `${pred.card.content}\n`
        contextPrompt += `Player chose: "${pred.choiceLabel}"\n`
      }
      contextPrompt += '\n'
    }

    // Current card
    contextPrompt += 'CURRENT SCENE:\n'
    contextPrompt += `Title: "${currentCard.title}"\n`
    contextPrompt += `Content: ${currentCard.content}\n\n`

    // Existing choices to avoid duplicates
    if (existingChoices.length > 0) {
      contextPrompt += `EXISTING CHOICES (do not repeat these): ${existingChoices.join(', ')}\n\n`
    }

    const systemPrompt = `You are a professional game designer and interactive fiction writer specializing in branching narrative design.

Your expertise includes:
- Creating meaningful player choices that impact the story
- Balancing action, dialogue, and exploration options
- Ensuring choices feel distinct and consequential
- Writing concise, action-oriented choice labels

Guidelines for choices:
- Each choice should lead the story in a meaningfully different direction
- Use active verbs (Investigate, Confront, Flee, Accept, Challenge)
- Keep labels short (3-7 words)
- Mix different types: action, dialogue, observation, tactical
- Consider player motivations: curiosity, caution, boldness, empathy`

    const userPrompt = `${contextPrompt}
Based on the story context above, generate 3 compelling choices the player could make at this moment.

Each choice should:
1. Make sense given the current scene and story progression
2. Lead the narrative in a distinct direction
3. Feel meaningful and engaging to the player
4. Be different from any existing choices

Respond in this exact JSON format:
{
  "choices": [
    {
      "label": "Short action-oriented choice text",
      "description": "Brief explanation of what this choice represents"
    },
    {
      "label": "Another distinct choice",
      "description": "Brief explanation"
    },
    {
      "label": "A third option",
      "description": "Brief explanation"
    }
  ]
}`

    const response = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 800,
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const result = JSON.parse(jsonMatch[0])
    const choices: GeneratedChoice[] = result.choices || []

    return NextResponse.json({
      success: true,
      choices,
      provider: response.provider,
    })
  } catch (error) {
    console.error('Error generating choices:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate choices' },
      { status: 500 }
    )
  }
}
