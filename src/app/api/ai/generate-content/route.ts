import { NextRequest, NextResponse } from 'next/server'
import { getLLMCompletion } from '@/lib/services/llmClient'

interface CardContext {
  title: string
  content: string
  message?: string | null
  speaker?: string | null
  speakerType?: string | null
}

interface ChoiceContext {
  label: string
  targetCardTitle?: string
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
  currentMessage?: string
  currentSpeaker?: string
  currentSpeakerType?: string
  currentChoices?: ChoiceContext[]
  characters?: string[]  // Available character names in the story
}

/**
 * POST /api/ai/generate-content
 * Generate card title, content, message and choices based on predecessor/successor context
 */
export async function POST(request: NextRequest) {
  try {
    const body: GenerateContentRequest = await request.json()
    const { 
      predecessors, 
      successors, 
      currentTitle, 
      currentContent,
      currentMessage,
      currentSpeaker,
      currentSpeakerType,
      currentChoices,
      characters 
    } = body

    // Build context from predecessors and successors
    let contextPrompt = ''

    if (predecessors.length > 0) {
      contextPrompt += 'PRECEDING STORY CARDS:\n'
      for (const pred of predecessors) {
        contextPrompt += `\n--- Card: "${pred.card.title}" ---\n`
        contextPrompt += `Content: ${pred.card.content}\n`
        if (pred.card.message) {
          contextPrompt += `Message: "${pred.card.message}" (Speaker: ${pred.card.speaker || 'Unknown'}, Type: ${pred.card.speakerType || 'character'})\n`
        }
        contextPrompt += `Choice that leads here: "${pred.choiceLabel}"\n`
      }
      contextPrompt += '\n'
    }

    if (successors.length > 0) {
      contextPrompt += 'FOLLOWING STORY CARDS:\n'
      for (const succ of successors) {
        contextPrompt += `\n--- Card: "${succ.card.title}" ---\n`
        contextPrompt += `Content: ${succ.card.content}\n`
        if (succ.card.message) {
          contextPrompt += `Message: "${succ.card.message}" (Speaker: ${succ.card.speaker || 'Unknown'})\n`
        }
        contextPrompt += `Choice leading to this: "${succ.choiceLabel}"\n`
      }
      contextPrompt += '\n'
    }

    if (currentTitle || currentContent || currentMessage || currentChoices?.length) {
      contextPrompt += 'CURRENT CARD DRAFT:\n'
      if (currentTitle) contextPrompt += `Title: ${currentTitle}\n`
      if (currentContent) contextPrompt += `Content: ${currentContent}\n`
      if (currentMessage) {
        contextPrompt += `Message: "${currentMessage}"\n`
        if (currentSpeaker) contextPrompt += `Speaker: ${currentSpeaker} (${currentSpeakerType || 'character'})\n`
      }
      if (currentChoices && currentChoices.length > 0) {
        contextPrompt += `Existing choices: ${currentChoices.map(c => `"${c.label}"`).join(', ')}\n`
      }
      contextPrompt += '\n'
    }

    if (characters && characters.length > 0) {
      contextPrompt += `AVAILABLE CHARACTERS: ${characters.join(', ')}\n\n`
    }

    const systemPrompt = `You are a professional interactive fiction and game storywriter. You craft engaging, immersive narrative content for choice-based story games.

Your writing style:
- Vivid, evocative descriptions that bring scenes to life
- Second-person perspective ("You enter the room...")
- Present tense for immediacy
- Concise but atmospheric (2-4 paragraphs typically)
- Ends in a way that naturally leads to player choices
- No explicit violence or mature content

For dialogue messages:
- Short, punchy lines that reveal character
- Match the tone to the speaker type (character dialogue vs narrator narration vs system text)
- 1-3 sentences max

For choices:
- 2-4 clear, meaningful options
- Each should lead to different outcomes
- Action-oriented (e.g., "Fight back", "Run away", "Try to negotiate")
- Brief but descriptive (3-6 words typically)`

    const userPrompt = `${contextPrompt}
Based on the story context above, generate OR IMPROVE the following for this story card:

1. **Title**: A short evocative title (3-6 words)
2. **Content**: The narrative content (2-4 paragraphs, second-person present tense)
3. **Message** (optional): A dialogue bubble shown on the card - spoken by a character, narrator, or system
4. **Speaker** (if message): Who is speaking
5. **SpeakerType**: "character", "narrator", or "system"
6. **Choices**: 2-4 meaningful choices that lead to different outcomes

${currentChoices && currentChoices.length > 0 
  ? 'There are already choices configured - improve their labels to be more engaging while keeping the same number.'
  : 'Suggest 2-4 appropriate choices for this scene.'}

Respond in this exact JSON format:
{
  "title": "A short evocative title",
  "content": "The narrative content...",
  "message": "Optional dialogue or null",
  "speaker": "Speaker name or null", 
  "speakerType": "character" | "narrator" | "system" | null,
  "choices": ["Choice 1", "Choice 2", "Choice 3"]
}`

    const response = await getLLMCompletion({
      prompt: userPrompt,
      systemPrompt,
      maxTokens: 1500,
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
      message: result.message || null,
      speaker: result.speaker || null,
      speakerType: result.speakerType || null,
      choices: result.choices || [],
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
