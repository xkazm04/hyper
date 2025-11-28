/**
 * Groq LLM Client for Hyper
 * 
 * Uses meta-llama/llama-4-maverick-17b-128e-instruct for art style extraction
 */

import { LLMRequest, LLMResponse, LLMProgress, LLMProvider } from '../types'
import {
  GroqMessage,
  GroqContentPart,
  GroqRequestBody,
  GROQ_BASE_URL,
  DEFAULT_MODEL,
  VISION_MODEL,
  MAX_OUTPUT_TOKENS,
} from './types'
import { makeGroqRequest, groqResponseToLLMResponse, createErrorResponse } from './streaming'

export class GroqClient implements LLMProvider {
  name = 'groq'
  private apiKey: string | null = null
  private defaultModel: string

  constructor(config?: { apiKey?: string; defaultModel?: string }) {
    this.apiKey = config?.apiKey || process.env.GROQ_API_KEY || null
    this.defaultModel = config?.defaultModel || DEFAULT_MODEL
  }

  async generate(request: LLMRequest, progress?: LLMProgress): Promise<LLMResponse> {
    const taskId = `groq_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key is required. Set GROQ_API_KEY environment variable.')
      }

      progress?.onStart?.(taskId)
      progress?.onProgress?.(10, 'Connecting to Groq...')

      const messages: GroqMessage[] = []

      if (request.systemPrompt) {
        messages.push({
          role: 'system',
          content: request.systemPrompt
        })
      }

      messages.push({
        role: 'user',
        content: request.prompt
      })

      const requestBody: GroqRequestBody = {
        model: request.model || this.defaultModel,
        messages,
        stream: false
      }

      if (request.maxTokens) {
        requestBody.max_tokens = Math.min(request.maxTokens, MAX_OUTPUT_TOKENS)
      }

      if (request.temperature !== undefined) {
        requestBody.temperature = request.temperature
      }

      const result = await makeGroqRequest(this.apiKey, requestBody, progress)

      progress?.onProgress?.(90, 'Finalizing response...')

      const llmResponse = groqResponseToLLMResponse(result, this.name)

      progress?.onProgress?.(100, 'Complete')
      progress?.onComplete?.(llmResponse)

      return llmResponse

    } catch (error) {
      const llmResponse = createErrorResponse(error, this.name)
      progress?.onError?.(llmResponse.error || 'Unknown error')
      return llmResponse
    }
  }

  /**
   * Generate with vision - analyze an image
   */
  async generateWithVision(
    imageUrl: string,
    prompt: string,
    systemPrompt?: string,
    progress?: LLMProgress
  ): Promise<LLMResponse> {
    const taskId = `groq_vision_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
    
    try {
      if (!this.apiKey) {
        throw new Error('Groq API key is required. Set GROQ_API_KEY environment variable.')
      }

      progress?.onStart?.(taskId)
      progress?.onProgress?.(10, 'Connecting to Groq Vision...')

      const messages: GroqMessage[] = []

      if (systemPrompt) {
        messages.push({
          role: 'system',
          content: systemPrompt
        })
      }

      // Create vision message with image
      const contentParts: GroqContentPart[] = [
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'high'
          }
        },
        {
          type: 'text',
          text: prompt
        }
      ]

      messages.push({
        role: 'user',
        content: contentParts
      })

      const requestBody: GroqRequestBody = {
        model: VISION_MODEL,
        messages,
        max_tokens: MAX_OUTPUT_TOKENS,
        temperature: 0.7,
        stream: false
      }

      progress?.onProgress?.(40, 'Analyzing image...')

      const result = await makeGroqRequest(this.apiKey, requestBody, progress)

      progress?.onProgress?.(90, 'Finalizing response...')

      const llmResponse = groqResponseToLLMResponse(result, this.name)

      progress?.onProgress?.(100, 'Complete')
      progress?.onComplete?.(llmResponse)

      return llmResponse

    } catch (error) {
      const llmResponse = createErrorResponse(error, this.name)
      progress?.onError?.(llmResponse.error || 'Unknown error')
      return llmResponse
    }
  }

  async checkAvailability(): Promise<boolean> {
    try {
      if (!this.apiKey) return false

      const response = await fetch(`${GROQ_BASE_URL}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      })

      return response.ok
    } catch {
      return false
    }
  }
}

// Singleton instance
let groqClientInstance: GroqClient | null = null

export function getGroqClient(): GroqClient {
  if (!groqClientInstance) {
    groqClientInstance = new GroqClient()
  }
  return groqClientInstance
}
