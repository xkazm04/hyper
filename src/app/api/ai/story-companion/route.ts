import { NextRequest, NextResponse } from 'next/server'
import { getLLMCompletion } from '@/lib/services/llmClient'
import { getAICompletion } from '@/lib/services/anthropic'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { StoryService } from '@/lib/services/story'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/ai/story-companion
 * Unified AI endpoint for story assistance
 *
 * Actions:
 * - generate-variants: Generate 3 content variations for a card
 * - suggest-next-steps: Suggest what happens next in the story
 * - architect-tree: Generate story tree with levels and choices, persist to DB
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
      case 'architect-tree':
        return handleArchitectTree(body)
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
 * Generate story tree with levels and choices per card, persist to database
 *
 * This generates a tree structure:
 * - Level 0: Source card (already exists)
 * - Level 1: choicesPerCard cards branching from source
 * - Level 2: choicesPerCard cards branching from each Level 1 card
 * - etc.
 *
 * Total new cards = sum of choicesPerCard^level for level 1 to levels
 */
async function handleArchitectTree(body: any) {
  const { storyContext, sourceCardId, levels, choicesPerCard, storyStackId } = body

  if (!sourceCardId || !storyStackId) {
    return NextResponse.json({ error: 'Source card and story stack ID are required' }, { status: 400 })
  }

  if (!levels || levels < 1 || levels > 5) {
    return NextResponse.json({ error: 'Levels must be between 1 and 5' }, { status: 400 })
  }

  if (!choicesPerCard || choicesPerCard < 1 || choicesPerCard > 2) {
    return NextResponse.json({ error: 'Choices per card must be 1 or 2' }, { status: 400 })
  }

  // Calculate total cards needed
  let totalCards = 0
  for (let i = 1; i <= levels; i++) {
    totalCards += Math.pow(choicesPerCard, i)
  }

  // Find source card
  const sourceCard = storyContext?.allCards?.find((c: any) => c.id === sourceCardId)
  if (!sourceCard) {
    return NextResponse.json({ error: 'Source card not found in context' }, { status: 400 })
  }

  // Build context prompt
  let contextPrompt = buildStoryContextPrompt(storyContext)

  // Build an example structure to help LLM understand the exact format
  const exampleCards = []
  const exampleConnections = []
  let cardIndex = 1

  // Generate example structure for first few cards
  for (let level = 1; level <= Math.min(levels, 2); level++) {
    const cardsAtLevel = Math.pow(choicesPerCard, level)
    for (let i = 0; i < Math.min(cardsAtLevel, 2); i++) {
      exampleCards.push({
        tempId: `card_${cardIndex}`,
        title: `Scene ${cardIndex} Title`,
        content: `Scene ${cardIndex} story content (2-3 paragraphs)...`,
        level: level
      })
      cardIndex++
    }
  }

  // Example connections
  exampleConnections.push({ sourceTempId: 'source', targetTempId: 'card_1', label: 'First choice' })
  if (choicesPerCard > 1) {
    exampleConnections.push({ sourceTempId: 'source', targetTempId: 'card_2', label: 'Second choice' })
  }

  const systemPrompt = `You are an interactive fiction writer. Generate a story tree as a COMPLETE, VALID JSON object.

CRITICAL REQUIREMENTS:
1. Output ONLY a valid JSON object - no markdown, no text before or after
2. The JSON must be complete and properly closed with }}
3. Keep content concise (1-2 short paragraphs per card) to fit within limits

STRUCTURE:
- Generate exactly ${totalCards} new cards across ${levels} level(s)
- Each non-leaf card has exactly ${choicesPerCard} choice(s)
- Level ${levels} cards are endings (no outgoing choices)

JSON SCHEMA (follow exactly):
${JSON.stringify({ cards: exampleCards.slice(0, 2), connections: exampleConnections }, null, 2)}

Card tempIds: "card_1", "card_2", ... "card_${totalCards}"
Source card tempId: "source" (existing card you branch from)

Writing: Second-person present tense, engaging but brief.`

  const userPrompt = `Story: "${storyContext?.storyName || 'Untitled'}"
${storyContext?.storyDescription ? `Description: ${storyContext.storyDescription.substring(0, 200)}` : ''}

SOURCE CARD to branch from:
- Title: "${sourceCard.title}"
- Content: ${sourceCard.content ? sourceCard.content.substring(0, 300) : '(empty)'}

Generate ${totalCards} cards (${levels} levels, ${choicesPerCard} choices per non-leaf).
Output the complete JSON object only:`

  // Use higher token limit to prevent truncation
  const response = await getAICompletion({
    prompt: userPrompt,
    systemPrompt,
    maxTokens: 8000,
  })

  // Parse the JSON response with robust cleaning
  let cleanJson = response.trim()

  // Remove markdown code blocks if present
  cleanJson = cleanJson.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '')

  // Try to find JSON object boundaries
  const jsonStart = cleanJson.indexOf('{')
  const jsonEnd = cleanJson.lastIndexOf('}')

  if (jsonStart === -1 || jsonEnd === -1 || jsonEnd <= jsonStart) {
    console.error('Failed to find JSON boundaries in response:', cleanJson.substring(0, 500))
    return NextResponse.json({ error: 'AI response did not contain valid JSON. Please try again.' }, { status: 500 })
  }

  cleanJson = cleanJson.substring(jsonStart, jsonEnd + 1)

  let parsed
  try {
    parsed = JSON.parse(cleanJson)
  } catch (e) {
    console.error('Failed to parse AI response:', cleanJson.substring(0, 1000))
    // Try to provide more helpful error
    const errorMsg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({
      error: `AI returned malformed JSON (${errorMsg}). Try generating fewer levels or try again.`
    }, { status: 500 })
  }

  if (!parsed.cards || !Array.isArray(parsed.cards) || parsed.cards.length === 0) {
    return NextResponse.json({ error: 'AI did not generate any cards' }, { status: 500 })
  }

  // Authenticate and get service
  const supabase = await createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const storyService = new StoryService(supabase)

  // Verify story ownership
  const storyStack = await storyService.getStoryStack(storyStackId)
  if (!storyStack || storyStack.ownerId !== user.id) {
    return NextResponse.json({ error: 'Story not found or unauthorized' }, { status: 403 })
  }

  // Get current card count for orderIndex
  const existingCards = await storyService.getStoryCards(storyStackId)
  let orderIndex = existingCards.length

  // Map tempId to real UUID
  const idMap: Record<string, string> = {
    'source': sourceCardId,
  }

  // Create cards in database
  const savedCards: any[] = []
  for (const card of parsed.cards) {
    const newCard = await storyService.createStoryCard({
      storyStackId,
      title: card.title || 'Untitled Scene',
      content: card.content || '',
      orderIndex: orderIndex++,
    })
    idMap[card.tempId] = newCard.id
    savedCards.push(newCard)
  }

  // Create choices in database
  const savedChoices: any[] = []
  for (const conn of parsed.connections || []) {
    const sourceId = idMap[conn.sourceTempId]
    const targetId = idMap[conn.targetTempId]

    if (!sourceId || !targetId) {
      console.warn('Skipping invalid connection:', conn)
      continue
    }

    // Get current choice count for this source card
    const existingChoices = await storyService.getChoices(sourceId)

    const newChoice = await storyService.createChoice({
      storyCardId: sourceId,
      targetCardId: targetId,
      label: conn.label || 'Continue',
      orderIndex: existingChoices.length,
    })
    savedChoices.push(newChoice)
  }

  return NextResponse.json({
    success: true,
    cards: savedCards,
    choices: savedChoices,
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
