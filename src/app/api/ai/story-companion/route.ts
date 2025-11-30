import { NextRequest, NextResponse } from 'next/server'
import { getLLMCompletion } from '@/lib/services/llmClient'
import { getAICompletion } from '@/lib/services/anthropic'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/ai/story-companion
 * Unified AI endpoint for story assistance
 *
 * Actions:
 * - generate-variants: Generate 3 content variations for a card
 * - suggest-next-steps: Suggest what happens next in the story
 * - architect-story: Generate full story structure
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'generate-variants':
        return handleGenerateVariants(body)
      case 'suggest-next-steps':
        return handleSuggestNextSteps(body)
      case 'architect-story':
        return handleArchitectStory(body)
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('AI Story Companion error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal error' },
      { status: 500 }
    )
  }
}

/**
 * Generate 3 content variations for the current card
 */
async function handleGenerateVariants(body: any) {
  const { storyContext, variantCount = 3 } = body

  if (!storyContext?.currentCard) {
    return NextResponse.json({ error: 'No current card provided' }, { status: 400 })
  }

  // Build context from predecessors and successors
  let contextPrompt = buildStoryContextPrompt(storyContext)

  const systemPrompt = `You are a professional interactive fiction writer. You craft engaging, immersive narrative content for choice-based story games.

Your writing style:
- Vivid, evocative descriptions that bring scenes to life
- Second-person perspective ("You enter the room...")
- Present tense for immediacy
- Concise but atmospheric (2-4 paragraphs typically)
- Ends in a way that naturally leads to player choices
- No explicit violence or mature content

For dialogue:
- Short, punchy lines that reveal character
- 1-3 sentences max`

  const userPrompt = `${contextPrompt}

Based on the story context above, generate ${variantCount} DIFFERENT variations for the current card's content.

Each variation should:
1. Have a different narrative approach or focus
2. Fit seamlessly with predecessor and successor content
3. Be engaging and immersive
4. End in a way that leads to meaningful player choices

Respond in this exact JSON format:
{
  "variants": [
    {
      "title": "A short evocative title (3-6 words)",
      "content": "The narrative content (2-4 paragraphs)...",
      "message": "Optional dialogue bubble or null",
      "speaker": "Speaker name or null",
      "confidence": 0.85,
      "reasoning": "Brief explanation of this approach"
    }
  ]
}`

  const response = await getLLMCompletion({
    prompt: userPrompt,
    systemPrompt,
    maxTokens: 3000,
  })

  // Parse JSON response
  const jsonMatch = response.content.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    throw new Error('Failed to parse AI response')
  }

  const result = JSON.parse(jsonMatch[0])

  // Add IDs to variants
  const variants = (result.variants || []).map((v: any, index: number) => ({
    id: `variant-${Date.now()}-${index}`,
    title: v.title || 'Untitled',
    content: v.content || '',
    message: v.message || null,
    speaker: v.speaker || null,
    confidence: Math.min(Math.max(v.confidence || 0.7, 0), 1),
    reasoning: v.reasoning || '',
  }))

  return NextResponse.json({ success: true, variants })
}

/**
 * Suggest next steps (what happens after the current card)
 */
async function handleSuggestNextSteps(body: any) {
  const { storyContext, sourceCardId, maxSuggestions = 3 } = body

  if (!storyContext) {
    return NextResponse.json({ error: 'No story context provided' }, { status: 400 })
  }

  // Find the source card
  const sourceCard = sourceCardId
    ? storyContext.allCards?.find((c: any) => c.id === sourceCardId)
    : storyContext.currentCard

  if (!sourceCard) {
    return NextResponse.json({ error: 'Source card not found' }, { status: 400 })
  }

  // Build context
  let contextPrompt = buildStoryContextPrompt(storyContext)

  // Determine if this is an early card (needs scene-setting help)
  const isEarlyStory = (storyContext.allCards?.length || 0) <= 3
  const hasContent = sourceCard.content && sourceCard.content.trim().length > 50

  const systemPrompt = `You are a creative AI assistant specialized in interactive storytelling. Your role is to predict and suggest the next logical story cards that would continue a branching narrative.

When analyzing a story, consider:
1. The narrative arc and pacing
2. Character development opportunities
3. Thematic consistency
4. Player agency and meaningful choices
5. Genre conventions and expectations
6. Emotional beats and tension

${isEarlyStory ? `
IMPORTANT: This story is just beginning. Help the author set the scene by:
- Establishing the setting vividly
- Introducing key characters or situations
- Creating an inciting incident or hook
- Building atmosphere and tone
` : `
This story is in progress. Focus on:
- Maintaining continuity with previous events
- Advancing the plot meaningfully
- Creating branching opportunities
- Building toward climactic moments
`}

Output as JSON only, no markdown or explanations.`

  const userPrompt = `${contextPrompt}

**Source Card for Branching:** "${sourceCard.title}"
${sourceCard.content ? `Content: ${sourceCard.content.substring(0, 500)}...` : 'No content yet'}

Generate ${maxSuggestions} suggested cards that would logically follow from this card. Each suggestion should represent a different player choice or story direction.

${!hasContent ? `
Note: The source card has minimal content. Your suggestions should help establish:
- What is happening in this scene
- What choices the player might face
- Where the story could go from here
` : ''}

Respond with JSON in this exact format:
{
  "suggestions": [
    {
      "title": "Scene Title (3-6 words)",
      "content": "2-3 paragraphs of narrative content in second-person present tense...",
      "choiceLabel": "Player choice text (e.g., 'Investigate the noise')",
      "imagePrompt": "Detailed image generation prompt for this scene",
      "confidence": 0.85,
      "reasoning": "Brief explanation of why this direction fits"
    }
  ]
}`

  const completion = await getAICompletion({
    prompt: userPrompt,
    systemPrompt,
    maxTokens: 2500,
  })

  // Parse the response
  const jsonMatch = completion.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ success: true, suggestions: [] })
  }

  const parsed = JSON.parse(jsonMatch[0])

  // Map to suggestions with IDs
  const suggestions = (parsed.suggestions || []).map((s: any, index: number) => ({
    id: `suggestion-${Date.now()}-${index}`,
    title: s.title || 'Untitled Scene',
    content: s.content || '',
    choiceLabel: s.choiceLabel || 'Continue',
    imagePrompt: s.imagePrompt || '',
    sourceCardId: sourceCardId || sourceCard?.id,
    confidence: Math.min(Math.max(s.confidence || 0.7, 0), 1),
    reasoning: s.reasoning || '',
  }))

  return NextResponse.json({ success: true, suggestions })
}

/**
 * Generate full story structure (architect mode)
 */
async function handleArchitectStory(body: any) {
  const { description, cardCount, currentCards } = body

  if (!description?.trim()) {
    return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  }

  const systemPrompt = `You are an expert interactive fiction writer and game designer.
Your task is to generate a JSON structure for a story game based on the user's description.

Output MUST be a valid JSON object with the following structure:
{
  "cards": [
    {
      "title": "Card Title",
      "content": "Story content for this card...",
      "type": "story" | "ending"
    }
  ],
  "connections": [
    {
      "sourceCardIndex": 0,
      "targetCardIndex": 1,
      "label": "Choice text leading to target"
    }
  ]
}

Rules:
1. Generate exactly ${cardCount} new cards.
2. Ensure the story flows logically.
3. 'connections' define the choices. sourceCardIndex and targetCardIndex refer to the index in the generated 'cards' array.
4. Create branching paths where appropriate.
5. Include at least one ending card.
6. Use second-person present tense ("You see...", "You decide...").
7. Do NOT include markdown formatting. Just the raw JSON string.`

  const userPrompt = `Description: ${description}
Number of cards to generate: ${cardCount}
${currentCards?.length > 0 ? `Existing cards in story: ${currentCards.map((c: any) => c.title).join(', ')}` : ''}`

  const response = await getAICompletion({
    prompt: userPrompt,
    systemPrompt,
    maxTokens: 4000,
  })

  // Clean up response if it contains markdown code blocks
  let cleanJson = response.trim()
  if (cleanJson.startsWith('```json')) {
    cleanJson = cleanJson.replace(/^```json/, '').replace(/```$/, '')
  } else if (cleanJson.startsWith('```')) {
    cleanJson = cleanJson.replace(/^```/, '').replace(/```$/, '')
  }

  const parsed = JSON.parse(cleanJson)

  // Post-process to add UUIDs
  const now = new Date().toISOString()
  const newCards = parsed.cards.map((card: any) => ({
    ...card,
    id: uuidv4(),
    createdAt: now,
    updatedAt: now,
  }))

  const newChoices = parsed.connections.map((conn: any) => ({
    id: uuidv4(),
    storyCardId: newCards[conn.sourceCardIndex].id,
    targetCardId: newCards[conn.targetCardIndex].id,
    label: conn.label,
    createdAt: now,
    updatedAt: now,
  }))

  return NextResponse.json({
    success: true,
    cards: newCards,
    choices: newChoices,
  })
}

/**
 * Helper: Build story context prompt from StoryContext
 */
function buildStoryContextPrompt(storyContext: any): string {
  let prompt = ''

  prompt += `**Story: ${storyContext.storyName || 'Untitled Story'}**\n`
  if (storyContext.storyDescription) {
    prompt += `${storyContext.storyDescription}\n`
  }
  prompt += '\n'

  if (storyContext.predecessors?.length > 0) {
    prompt += 'PRECEDING CARDS (what led to this moment):\n'
    for (const pred of storyContext.predecessors) {
      prompt += `\n--- "${pred.card.title}" ---\n`
      prompt += `Content: ${pred.card.content || '(empty)'}\n`
      if (pred.card.message) {
        prompt += `Dialog: "${pred.card.message}" (${pred.card.speaker || 'Unknown'})\n`
      }
      prompt += `Choice that leads here: "${pred.choiceLabel}"\n`
    }
    prompt += '\n'
  }

  if (storyContext.currentCard) {
    prompt += 'CURRENT CARD (to be written/improved):\n'
    prompt += `Title: ${storyContext.currentCard.title || '(no title)'}\n`
    prompt += `Content: ${storyContext.currentCard.content || '(empty)'}\n`
    if (storyContext.currentCard.message) {
      prompt += `Dialog: "${storyContext.currentCard.message}" (${storyContext.currentCard.speaker || 'Unknown'})\n`
    }
    prompt += '\n'
  }

  if (storyContext.successors?.length > 0) {
    prompt += 'FOLLOWING CARDS (what this leads to):\n'
    for (const succ of storyContext.successors) {
      prompt += `\n--- "${succ.card.title}" ---\n`
      prompt += `Content: ${succ.card.content || '(empty)'}\n`
      prompt += `Choice leading here: "${succ.choiceLabel}"\n`
    }
    prompt += '\n'
  }

  if (storyContext.characters?.length > 0) {
    prompt += `CHARACTERS: ${storyContext.characters.map((c: any) => c.name).join(', ')}\n\n`
  }

  // Add story structure summary if there are many cards
  if (storyContext.allCards?.length > 5) {
    prompt += `STORY STRUCTURE: ${storyContext.allCards.length} total cards, ${storyContext.choices?.length || 0} connections\n`
    prompt += `Recent cards: ${storyContext.allCards.slice(-3).map((c: any) => c.title).join(' -> ')}\n\n`
  }

  return prompt
}
