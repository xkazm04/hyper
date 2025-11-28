/**
 * Groq API Types
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string | GroqContentPart[]
}

export interface GroqContentPart {
  type: 'text' | 'image_url'
  text?: string
  image_url?: {
    url: string
    detail?: 'auto' | 'low' | 'high'
  }
}

export interface GroqRequestBody {
  model: string
  messages: GroqMessage[]
  max_tokens?: number
  temperature?: number
  stream?: boolean
}

export interface GroqResponse {
  id: string
  object: string
  created: number
  model: string
  choices: Array<{
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }>
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export const GROQ_BASE_URL = 'https://api.groq.com/openai/v1'
export const DEFAULT_MODEL = 'meta-llama/llama-4-maverick-17b-128e-instruct'
export const VISION_MODEL = 'meta-llama/llama-4-scout-17b-16e-instruct'
export const MAX_OUTPUT_TOKENS = 4096
