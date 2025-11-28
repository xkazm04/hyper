/**
 * Image Processing - AI image generation
 */

import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { ImageGenerationError } from '@/lib/types'
import { GenerateImageOptions, ImageGenerationResult, MAX_RETRIES, RETRY_DELAY_MS } from './types'

// Initialize clients
let openai: OpenAI | null = null
let anthropic: Anthropic | null = null

if (process.env.NEXT_PUBLIC_OPENAI_API_KEY || process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || process.env.NEXT_PUBLIC_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
  })
}

if (process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY || process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    dangerouslyAllowBrowser: true,
  })
}

/**
 * Helper method to sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Generate image using OpenAI DALL-E
 */
export async function generateWithOpenAI(
  prompt: string,
  size: '1024x1024' | '1792x1024' | '1024x1792',
  quality: 'standard' | 'hd'
): Promise<string> {
  if (!openai) {
    throw new ImageGenerationError('OpenAI API key not configured')
  }

  try {
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      response_format: 'url',
    })

    if (!response.data || response.data.length === 0) {
      throw new ImageGenerationError('No image data returned from OpenAI')
    }

    const imageUrl = response.data[0]?.url
    if (!imageUrl) {
      throw new ImageGenerationError('No image URL returned from OpenAI')
    }

    return imageUrl
  } catch (error: any) {
    throw new ImageGenerationError(`OpenAI generation failed: ${error.message}`)
  }
}

/**
 * Generate image using Anthropic Claude (placeholder)
 */
export async function generateWithAnthropic(prompt: string): Promise<string> {
  if (!anthropic) {
    throw new ImageGenerationError('Anthropic API key not configured')
  }

  // Note: Anthropic doesn't have native image generation
  // Fall back to OpenAI if available
  if (openai) {
    console.warn('Anthropic image generation not available, falling back to OpenAI')
    return generateWithOpenAI(prompt, '1024x1024', 'standard')
  }

  throw new ImageGenerationError('Anthropic image generation not implemented')
}

/**
 * Generate an image using AI based on a text prompt
 * Implements retry logic with exponential backoff
 */
export async function generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
  const { prompt, provider = 'openai', size = '1024x1024', quality = 'standard' } = options

  // Validate prompt length
  if (!prompt || prompt.trim().length < 10) {
    throw new ImageGenerationError('Prompt must be at least 10 characters long')
  }

  // Determine which provider to use
  const selectedProvider = provider === 'anthropic' && anthropic ? 'anthropic' : 'openai'

  // Retry logic
  let lastError: Error | null = null
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      let imageUrl: string

      if (selectedProvider === 'openai') {
        imageUrl = await generateWithOpenAI(prompt, size, quality)
      } else {
        imageUrl = await generateWithAnthropic(prompt)
      }

      return {
        imageUrl,
        prompt,
        provider: selectedProvider,
      }
    } catch (error) {
      lastError = error as Error
      console.error(`Image generation attempt ${attempt} failed:`, error)

      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1)
        await sleep(delay)
      }
    }
  }

  throw new ImageGenerationError(
    `Failed to generate image after ${MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
  )
}

export { openai, anthropic }
