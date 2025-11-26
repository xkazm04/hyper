'use server'

import { getAICompletion } from '@/lib/services/anthropic'
import { v4 as uuidv4 } from 'uuid'

interface StoryGenerationRequest {
    description: string
    cardCount: number
    currentCards: any[]
}

export async function generateStoryStructure(request: StoryGenerationRequest) {
    const { description, cardCount, currentCards } = request

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
        "sourceCardIndex": 0, // Index in the 'cards' array above
        "targetCardIndex": 1, // Index in the 'cards' array above
        "label": "Choice text leading to target"
      }
    ]
  }

  Rules:
  1. Generate exactly ${cardCount} new cards.
  2. Ensure the story flows logically.
  3. 'connections' define the choices. sourceCardIndex and targetCardIndex refer to the index in the generated 'cards' array.
  4. If 'currentCards' are provided, try to fit the new story extension to them, but for now, treat this as a standalone generation or extension.
  5. Do NOT include markdown formatting (like \`\`\`json). Just the raw JSON string.
  `

    const userPrompt = `Description: ${description}
  Number of cards to generate: ${cardCount}
  `

    try {
        const response = await getAICompletion({
            prompt: userPrompt,
            systemPrompt,
            maxTokens: 4000
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
        const newCards = parsed.cards.map((card: any) => ({
            ...card,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }))

        const newChoices = parsed.connections.map((conn: any) => ({
            id: uuidv4(),
            storyCardId: newCards[conn.sourceCardIndex].id,
            targetCardId: newCards[conn.targetCardIndex].id,
            label: conn.label,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        }))

        return { success: true, cards: newCards, choices: newChoices }

    } catch (error) {
        console.error('Story generation failed:', error)
        return { success: false, error: 'Failed to generate story structure' }
    }
}
