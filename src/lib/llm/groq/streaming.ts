/**
 * Groq Streaming Utilities
 */

import { LLMProgress, LLMResponse } from '../types'
import { GroqRequestBody, GroqResponse, GROQ_BASE_URL } from './types'

/**
 * Makes a request to the Groq API
 */
export async function makeGroqRequest(
  apiKey: string,
  requestBody: GroqRequestBody,
  progress?: LLMProgress
): Promise<GroqResponse> {
  progress?.onProgress?.(40, 'Processing request...')

  const response = await fetch(`${GROQ_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify(requestBody)
  })

  progress?.onProgress?.(70, 'Processing response...')

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error')
    let errorMessage = `Groq API error (${response.status}): ${errorText}`

    try {
      const errorData = JSON.parse(errorText)
      if (errorData.error?.message) {
        errorMessage = errorData.error.message
      }
    } catch {
      // Use raw error text
    }

    throw new Error(errorMessage)
  }

  return response.json()
}

/**
 * Converts a Groq response to an LLM response
 */
export function groqResponseToLLMResponse(
  result: GroqResponse,
  providerName: string
): LLMResponse {
  const content = result.choices[0]?.message?.content || ''

  return {
    success: true,
    response: content,
    model: result.model,
    provider: providerName,
    usage: {
      prompt_tokens: result.usage.prompt_tokens,
      completion_tokens: result.usage.completion_tokens,
      total_tokens: result.usage.total_tokens
    }
  }
}

/**
 * Creates an error LLM response
 */
export function createErrorResponse(
  error: unknown,
  providerName: string
): LLMResponse {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
  
  return {
    success: false,
    error: errorMessage,
    provider: providerName
  }
}
