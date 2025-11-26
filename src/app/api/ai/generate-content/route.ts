import { NextRequest, NextResponse } from 'next/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

interface CardContext {
  title: string
  content: string
}

interface PredecessorContext {
  card: CardContext
  choiceLabel: string
}

interface SuccessorContext {
  card: CardContext
  choiceLabel: string
}

interface GenerateContentRequest {
  predecessors: PredecessorContext[]
  successors: SuccessorContext[]
  currentTitle?: string
  currentContent?: string
}

/**
 * POST /api/ai/generate-content
 * Generate card title and content based on predecessor/successor context
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json()
    const { predecessors, successors, currentTitle, currentContent } = body

    // Build context from predecessors and successors
    let contextPrompt = ''

    if (predecessors.length > 0) {
      contextPrompt += 'PRECEDING STORY CARDS:\n'
      for (const pred of predecessors) {
        contextPrompt += `\n--- Card: "${pred.card.title}" ---\n`
        contextPrompt += `Content: ${pred.card.content}\n`
        contextPrompt += `Choice that leads here: "${pred.choiceLabel}"\n`
      }
      contextPrompt += '\n'
    }

    if (successors.length > 0) {
      contextPrompt += 'FOLLOWING STORY CARDS:\n'
      for (const succ of successors) {
        contextPrompt += `\n--- Card: "${succ.card.title}" ---\n`
        contextPrompt += `Content: ${succ.card.content}\n`
        contextPrompt += `Choice leading to this: "${succ.choiceLabel}"\n`
      }
      contextPrompt += '\n'
    }

    if (currentTitle || currentContent) {
      contextPrompt += 'CURRENT CARD DRAFT:\n'
      if (currentTitle) contextPrompt += `Title: ${currentTitle}\n`
      if (currentContent) contextPrompt += `Content: ${currentContent}\n`
      contextPrompt += '\n'
    }

    const systemPrompt = `You are a professional interactive fiction and game storywriter. You craft engaging, immersive narrative content for choice-based story games.

Your writing style:
- Vivid, evocative descriptions that bring scenes to life
- Second-person perspective ("You enter the room...")
- Present tense for immediacy
- Concise but atmospheric (2-4 paragraphs typically)
- Ends in a way that naturally leads to player choices
- No explicit violence or mature content

You will generate a card title and content that fits seamlessly between the provided context.`

    const userPrompt = `${contextPrompt}
Based on the story context above, generate a title and narrative content for this story card.

The content should:
1. Flow naturally from the preceding card(s) and the choice the player made
2. Set up the situation that leads to the next card(s) if they exist
3. Be engaging and immersive, written in second-person present tense
4. Be 2-4 paragraphs long

Respond in this exact JSON format:
{
  "title": "A short evocative title (3-6 words)",
  "content": "The narrative content for this card..."
}`

    const response = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 1024,
    })

    // Parse JSON response
    const jsonMatch = response.content.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response')
    }

    const result = JSON.parse(jsonMatch[0])

    return NextResponse.json({
      success: true,
      title: result.title,
      content: result.content,
      provider: response.provider,
    })
  } catch (error) {
    console.error('Error generating content:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate content' },
      { status: 500 }
    )
  }
}
