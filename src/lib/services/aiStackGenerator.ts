import { getAICompletion } from './anthropic'
import { StackTemplateCard } from '@/lib/templates/stackTemplates'

export interface GeneratedStackTemplate {
  name: string
  description: string
  tags: string[]
  cards: StackTemplateCard[]
}

const SYSTEM_PROMPT = `You are an expert at designing interactive HyperCard-style stacks. When given a concept or theme, you create engaging, well-structured card-based experiences.

Your task is to generate a complete stack template with multiple cards, each containing interactive elements like buttons, text, images, and inputs.

Guidelines:
- Create 3-6 cards that tell a coherent story or provide a complete experience
- Use appropriate colors that match the theme (hex format)
- Position elements thoughtfully (canvas size is 800x600px)
- Include navigation buttons between cards (use navigate("next"), navigate("prev"), navigate("first"), navigate("last"))
- Add interactive elements where appropriate (buttons with scripts, input fields, etc.)
- Make text content engaging and relevant to the theme
- Use varied element types: button, text, image, input, shape
- Keep scripts simple (use alert() for feedback, navigate() for navigation)

Element positioning guidelines:
- x, y: position from top-left
- width, height: size of element
- Buttons: typically 120-300px wide, 40-60px tall
- Text headers: typically 400-600px wide, 50-100px tall
- Body text: typically 400-600px wide, 80-200px tall
- Input fields: typically 200-400px wide, 35-50px tall

Available element types:
1. button: Interactive buttons with labels and scripts
   Properties: label, fontSize, backgroundColor, color, borderWidth, borderColor, borderRadius, hoverColor
2. text: Static text with formatting options
   Properties: content, fontSize, fontFamily, color, align (left/center/right), bold, italic
3. input: Text input fields with placeholders
   Properties: placeholder, value, type (text/number/email), fontSize, borderWidth, borderColor
4. image: Image elements (use placeholder URLs for now)
   Properties: src, alt, objectFit (contain/cover/fill)
5. shape: Geometric shapes (rectangle, circle, line)
   Properties: shape (rectangle/circle/line), backgroundColor, borderWidth, borderColor

Return ONLY valid JSON matching this exact structure (no markdown, no explanations):
{
  "name": "Stack Name",
  "description": "Brief description of the stack",
  "tags": ["tag1", "tag2", "tag3"],
  "cards": [
    {
      "name": "Card Name",
      "backgroundColor": "#HEXCOLOR",
      "elements": [
        {
          "type": "text",
          "position": {"x": 200, "y": 100, "width": 400, "height": 60},
          "properties": {
            "content": "Text content here",
            "fontSize": 24,
            "color": "#000000",
            "align": "center",
            "bold": true
          },
          "script": null
        },
        {
          "type": "button",
          "position": {"x": 340, "y": 400, "width": 120, "height": 45},
          "properties": {
            "label": "Next",
            "fontSize": 16,
            "backgroundColor": "#4CAF50",
            "color": "#FFFFFF",
            "borderWidth": 3,
            "borderColor": "#000000",
            "borderRadius": 8
          },
          "script": "navigate(\\"next\\")"
        }
      ]
    }
  ]
}`

export async function generateStackTemplate(concept: string): Promise<GeneratedStackTemplate> {
  const prompt = `Generate a complete HyperCard stack for the following concept or theme:

"${concept}"

Create an engaging, interactive experience with 3-6 cards. Include appropriate navigation, interactive elements, and content that brings this concept to life.

Return the JSON structure as specified in the system prompt.`

  try {
    const response = await getAICompletion({
      prompt,
      systemPrompt: SYSTEM_PROMPT,
      maxTokens: 4096,
    })

    // Clean up the response - remove markdown code blocks if present
    let cleanedResponse = response.trim()
    if (cleanedResponse.startsWith('```json')) {
      cleanedResponse = cleanedResponse.replace(/^```json\n/, '').replace(/\n```$/, '')
    } else if (cleanedResponse.startsWith('```')) {
      cleanedResponse = cleanedResponse.replace(/^```\n/, '').replace(/\n```$/, '')
    }

    const parsed = JSON.parse(cleanedResponse)

    // Validate the structure
    if (!parsed.name || !parsed.description || !Array.isArray(parsed.cards)) {
      throw new Error('Invalid template structure returned from AI')
    }

    // Validate card structure
    for (const card of parsed.cards) {
      if (!card.name || !card.backgroundColor || !Array.isArray(card.elements)) {
        throw new Error('Invalid card structure in generated template')
      }

      // Validate elements
      for (const element of card.elements) {
        if (!element.type || !element.position || !element.properties) {
          throw new Error('Invalid element structure in generated template')
        }
      }
    }

    return parsed as GeneratedStackTemplate
  } catch (error) {
    console.error('Failed to generate stack template:', error)
    throw new Error(
      error instanceof Error
        ? `Failed to generate template: ${error.message}`
        : 'Failed to generate template from AI'
    )
  }
}

export async function classifyStackConcept(concept: string): Promise<string[]> {
  const prompt = `Given this stack concept: "${concept}"

Return 2-4 relevant tags/categories that describe this concept.
Examples: education, story, interactive, tutorial, game, business, creative, productivity, quiz, etc.

Return ONLY a JSON array of strings, nothing else:
["tag1", "tag2", "tag3"]`

  try {
    const response = await getAICompletion({
      prompt,
      maxTokens: 100,
    })

    const cleaned = response.trim().replace(/^```json\n/, '').replace(/\n```$/, '')
    const tags = JSON.parse(cleaned)

    if (!Array.isArray(tags)) {
      return ['generated', 'custom']
    }

    return tags.filter((tag: any) => typeof tag === 'string').slice(0, 4)
  } catch (error) {
    console.error('Failed to classify concept:', error)
    return ['generated', 'custom']
  }
}
