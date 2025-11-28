/**
 * Image Service Types
 */

export interface GenerateImageOptions {
  prompt: string
  provider?: 'openai' | 'anthropic'
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
}

export interface ImageGenerationResult {
  imageUrl: string
  prompt: string
  provider: 'openai' | 'anthropic'
}

export const STORAGE_BUCKET = 'story-images'
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB in bytes
export const MAX_RETRIES = 3
export const RETRY_DELAY_MS = 1000
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
