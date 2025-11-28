import { NextRequest, NextResponse } from 'next/server'
import { getAICompletion } from '@/lib/services/anthropic'
import {
  AIPredictionRequest,
  AIPredictionResponse,
  SuggestedCard,
} from '@/lib/types/ai-canvas'

const SYSTEM_PROMPT = `You are a creative AI assistant specialized in interactive storytelling. Your role is to predict and suggest the next logical story cards that would continue a branching narrative.

When analyzing a story, consider:
1. The narrative arc and pacing
2. Character development opportunities
3. Thematic consistency
4. Player agency and meaningful choices
5. Genre conventions and expectations
6. Emotional beats and tension

For each suggestion, provide:
- A compelling scene title
- Engaging narrative content (2-3 paragraphs)
- A choice label that would lead to this scene
- An image prompt for visual generation
- A confidence score (0.0-1.0) based on how well it fits the story

Output as JSON only, no markdown or explanations.`

const USER_PROMPT_TEMPLATE = `Analyze this interactive story and suggest the next logical cards:

**Story: {storyName}**
{storyDescription}

**Current Cards:**
{cardsContext}

**Existing Choices/Connections:**
{choicesContext}

**Current Focus Card:** {currentCard}

**User Preferences:**
- Style: {stylePrefs}
- Themes: {themePrefs}
- Structure: {structurePrefs}

Generate 1-3 suggested cards that would logically follow from the current card or fill story gaps. Each suggestion should branch from the current focus card or an appropriate existing card.

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "title": "Scene Title",
      "content": "2-3 paragraphs of narrative content...",
      "sourceCardId": "uuid of card this branches from",
      "choiceLabel": "Text for the choice button",
      "imagePrompt": "Detailed image generation prompt",
      "confidence": 0.85,
      "reasoning": "Brief explanation of why this fits"
    }
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const body: AIPredictionRequest = await request.json()
    const { storyContext, currentCardId, preferences } = body

    // Build the cards context
    const cardsContext = storyContext.cards
      .map(c => `- [${c.id}] "${c.title}" (depth: ${c.depth}): ${c.content.substring(0, 100)}...`)
      .join('\n')

    // Build the choices context
    const choicesContext = storyContext.choices
      .map(c => `- "${c.label}": ${c.sourceCardId} -> ${c.targetCardId}`)
      .join('\n')

    // Get current card info
    const currentCard = currentCardId
      ? storyContext.cards.find(c => c.id === currentCardId)
      : storyContext.cards[storyContext.cards.length - 1]

    // Build preference strings
    const stylePrefs = preferences?.styleWeights
      ? Object.entries(preferences.styleWeights)
          .filter(([_, v]) => v && v > 0.5)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')
      : 'balanced'

    const themePrefs = preferences?.themePreferences
      ? [
          preferences.themePreferences.preferredGenres?.join(', '),
          preferences.themePreferences.preferredSettings?.join(', '),
          preferences.themePreferences.preferredMoods?.join(', '),
        ]
          .filter(Boolean)
          .join('; ')
      : 'any'

    const structurePrefs = preferences?.structurePreferences
      ? `content length: ${preferences.structurePreferences.avgContentLength || 150} words, ` +
        `choices: ${preferences.structurePreferences.avgChoiceCount || 2}-3`
      : 'standard'

    // Build the prompt
    const userPrompt = USER_PROMPT_TEMPLATE
      .replace('{storyName}', storyContext.storyName)
      .replace('{storyDescription}', storyContext.storyDescription || 'An interactive adventure story.')
      .replace('{cardsContext}', cardsContext || 'No cards yet.')
      .replace('{choicesContext}', choicesContext || 'No connections yet.')
      .replace('{currentCard}', currentCard ? `"${currentCard.title}"` : 'Starting fresh')
      .replace('{stylePrefs}', stylePrefs)
      .replace('{themePrefs}', themePrefs)
      .replace('{structurePrefs}', structurePrefs)

    // Call AI
    const completion = await getAICompletion({
      prompt: userPrompt,
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 2000,
    })

    // Parse the response
    let parsed: { suggestions: Array<{
      title: string
      content: string
      sourceCardId: string
      choiceLabel: string
      imagePrompt?: string
      confidence: number
      reasoning?: string
    }> }

    try {
      // Try to extract JSON from the response
      const jsonMatch = completion.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      console.error('Failed to parse AI response:', completion)
      return NextResponse.json({
        suggestions: [],
        shouldUpdatePreferences: false,
      } as AIPredictionResponse)
    }

    // Map to SuggestedCard format with generated IDs
    const suggestions: SuggestedCard[] = parsed.suggestions.map((s, index) => ({
      id: `suggestion-${Date.now()}-${index}`,
      title: s.title,
      content: s.content,
      imagePrompt: s.imagePrompt,
      sourceCardId: s.sourceCardId || currentCard?.id || '',
      choiceLabel: s.choiceLabel,
      confidence: Math.min(Math.max(s.confidence, 0), 1), // Clamp to 0-1
      position: { x: 0, y: 0 }, // Position will be set by the canvas
      isHovered: false,
      isAnimatingIn: true,
      isAnimatingOut: false,
    }))

    const response: AIPredictionResponse = {
      suggestions,
      shouldUpdatePreferences: false,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('AI prediction error:', error)
    return NextResponse.json(
      { error: 'Failed to generate predictions' },
      { status: 500 }
    )
  }
}
