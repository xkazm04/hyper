import Anthropic from '@anthropic-ai/sdk'

// Check if API key is configured
const apiKey = process.env.ANTHROPIC_API_KEY || ''
const isConfigured = apiKey && apiKey !== '' && !apiKey.includes('placeholder')

const anthropic = isConfigured ? new Anthropic({ apiKey }) : null

export interface AICompletionRequest {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
}

export async function getAICompletion(request: AICompletionRequest): Promise<string> {
  if (!anthropic) {
    throw new Error('AI features are not configured. Please add ANTHROPIC_API_KEY to your environment variables.')
  }

  const { prompt, systemPrompt, maxTokens = 1024 } = request

  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
  })

  const textContent = message.content.find(block => block.type === 'text')
  return textContent && 'text' in textContent ? textContent.text : ''
}

export async function streamAICompletion(
  request: AICompletionRequest,
  onChunk: (text: string) => void
): Promise<void> {
  if (!anthropic) {
    throw new Error('AI features are not configured. Please add ANTHROPIC_API_KEY to your environment variables.')
  }

  const { prompt, systemPrompt, maxTokens = 1024 } = request

  const stream = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: maxTokens,
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
    stream: true,
  })

  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
      onChunk(event.delta.text)
    }
  }
}
