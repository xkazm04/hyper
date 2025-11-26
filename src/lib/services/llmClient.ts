/**
 * Multi-LLM Client
 * Supports both Anthropic (production) and Ollama (development) based on NODE_ENV
 */
import Anthropic from '@anthropic-ai/sdk'

// Ollama configuration
const OLLAMA_BASE_URL = 'http://localhost:11434'
const DEFAULT_OLLAMA_MODEL = 'gpt-oss:20b'

// Anthropic configuration
const ANTHROPIC_MODEL = 'claude-sonnet-4-20250514'
const ANTHROPIC_FAST_MODEL = 'claude-haiku-4-5-20251001'

// Determine which client to use based on environment
const isDevelopment = process.env.NODE_ENV === 'development'

// Check if Anthropic API key is configured
const anthropicApiKey = process.env.ANTHROPIC_API_KEY || ''
const isAnthropicConfigured = anthropicApiKey && anthropicApiKey !== '' && !anthropicApiKey.includes('placeholder')

// Create Anthropic client only if configured and in production
const anthropic = (!isDevelopment && isAnthropicConfigured) ? new Anthropic({ apiKey: anthropicApiKey }) : null

export interface LLMCompletionRequest {
  prompt: string
  systemPrompt?: string
  maxTokens?: number
  useFastModel?: boolean
}

export interface LLMResponse {
  content: string
  provider: 'anthropic' | 'ollama'
  model: string
}

/**
 * Ollama API response format
 */
interface OllamaResponse {
  model: string
  created_at: string
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  prompt_eval_duration?: number
  eval_count?: number
  eval_duration?: number
}

/**
 * Get completion from Ollama
 */
async function getOllamaCompletion(request: LLMCompletionRequest): Promise<LLMResponse> {
  const { prompt, systemPrompt, maxTokens = 1024 } = request
  
  const fullPrompt = systemPrompt 
    ? `${systemPrompt}\n\n${prompt}`
    : prompt

  const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: DEFAULT_OLLAMA_MODEL,
      prompt: fullPrompt,
      stream: false,
      options: {
        num_predict: maxTokens,
      },
    }),
  })

  if (!response.ok) {
    throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
  }

  const data: OllamaResponse = await response.json()

  return {
    content: data.response,
    provider: 'ollama',
    model: DEFAULT_OLLAMA_MODEL,
  }
}

/**
 * Get completion from Anthropic
 */
async function getAnthropicCompletion(request: LLMCompletionRequest): Promise<LLMResponse> {
  if (!anthropic) {
    throw new Error('Anthropic API is not configured. Please add ANTHROPIC_API_KEY to your environment variables.')
  }

  const { prompt, systemPrompt, maxTokens = 1024, useFastModel = false } = request
  const model = useFastModel ? ANTHROPIC_FAST_MODEL : ANTHROPIC_MODEL

  const message = await anthropic.messages.create({
    model,
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
  const content = textContent && 'text' in textContent ? textContent.text : ''

  return {
    content,
    provider: 'anthropic',
    model,
  }
}

/**
 * Get AI completion using the appropriate provider
 * - Development: Uses Ollama with local model
 * - Production: Uses Anthropic Claude
 */
export async function getLLMCompletion(request: LLMCompletionRequest): Promise<LLMResponse> {
  if (isDevelopment) {
    try {
      return await getOllamaCompletion(request)
    } catch (error) {
      console.warn('Ollama not available, falling back to Anthropic:', error)
      // Fallback to Anthropic if Ollama fails in development
      if (anthropic || isAnthropicConfigured) {
        const fallbackAnthropic = new Anthropic({ apiKey: anthropicApiKey })
        const { prompt, systemPrompt, maxTokens = 1024, useFastModel = false } = request
        const model = useFastModel ? ANTHROPIC_FAST_MODEL : ANTHROPIC_MODEL

        const message = await fallbackAnthropic.messages.create({
          model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [{ role: 'user', content: prompt }],
        })

        const textContent = message.content.find(block => block.type === 'text')
        const content = textContent && 'text' in textContent ? textContent.text : ''

        return { content, provider: 'anthropic', model }
      }
      throw error
    }
  }

  return getAnthropicCompletion(request)
}

/**
 * Stream AI completion (currently only supports Anthropic)
 */
export async function streamLLMCompletion(
  request: LLMCompletionRequest,
  onChunk: (text: string) => void
): Promise<{ provider: 'anthropic' | 'ollama'; model: string }> {
  if (isDevelopment) {
    // For Ollama streaming
    const { prompt, systemPrompt, maxTokens = 1024 } = request
    
    const fullPrompt = systemPrompt 
      ? `${systemPrompt}\n\n${prompt}`
      : prompt

    const response = await fetch(`${OLLAMA_BASE_URL}/api/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: DEFAULT_OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: true,
        options: {
          num_predict: maxTokens,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.status} ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const text = decoder.decode(value, { stream: true })
      const lines = text.split('\n').filter(line => line.trim())
      
      for (const line of lines) {
        try {
          const data = JSON.parse(line) as OllamaResponse
          if (data.response) {
            onChunk(data.response)
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }

    return { provider: 'ollama', model: DEFAULT_OLLAMA_MODEL }
  }

  // Anthropic streaming
  if (!anthropic) {
    throw new Error('Anthropic API is not configured.')
  }

  const { prompt, systemPrompt, maxTokens = 1024, useFastModel = false } = request
  const model = useFastModel ? ANTHROPIC_FAST_MODEL : ANTHROPIC_MODEL

  const stream = await anthropic.messages.create({
    model,
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

  return { provider: 'anthropic', model }
}

/**
 * Check if LLM services are available
 */
export function isLLMAvailable(): boolean {
  if (isDevelopment) {
    return true // Assume Ollama is available in development
  }
  return !!isAnthropicConfigured
}

/**
 * Get current LLM provider info
 */
export function getLLMProviderInfo(): { provider: 'anthropic' | 'ollama'; model: string } {
  if (isDevelopment) {
    return { provider: 'ollama', model: DEFAULT_OLLAMA_MODEL }
  }
  return { provider: 'anthropic', model: ANTHROPIC_MODEL }
}
