/**
 * LLM Types for Hyper
 */

export interface LLMRequest {
  prompt: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export interface LLMResponse {
  success: boolean
  response?: string
  model?: string
  provider?: string
  error?: string
  usage?: {
    prompt_tokens?: number
    completion_tokens?: number
    total_tokens?: number
  }
}

export interface LLMProgress {
  onStart?: (taskId: string) => void
  onProgress?: (progress: number, message?: string) => void
  onComplete?: (response: LLMResponse) => void
  onError?: (error: string) => void
}

export interface LLMProvider {
  name: string
  generate(request: LLMRequest, progress?: LLMProgress): Promise<LLMResponse>
  checkAvailability(): Promise<boolean>
}
