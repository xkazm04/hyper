import { createClient } from '@supabase/supabase-js'
import { ImageGenerationError, ImageUploadError } from '@/lib/types'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

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

/**
 * Server-side ImageService for secure API key usage
 * This should only be used in API routes or server components
 */
export class ImageServiceServer {
  private supabase
  private openai: OpenAI | null = null
  private anthropic: Anthropic | null = null
  private readonly STORAGE_BUCKET = 'story-images'
  private readonly MAX_RETRIES = 3
  private readonly RETRY_DELAY_MS = 1000

  constructor() {
    // Initialize Supabase with service role key for server-side operations
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      })
    }

    // Initialize Anthropic client if API key is available
    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      })
    }
  }

  /**
   * Generate an image using AI based on a text prompt
   * Implements retry logic with exponential backoff
   */
  async generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
    const { prompt, provider = 'openai', size = '1024x1024', quality = 'standard' } = options

    // Validate prompt length (minimum 10 characters as per requirements)
    if (!prompt || prompt.trim().length < 10) {
      throw new ImageGenerationError('Prompt must be at least 10 characters long')
    }

    // Determine which provider to use
    const selectedProvider = provider === 'anthropic' && this.anthropic ? 'anthropic' : 'openai'

    // Retry logic
    let lastError: Error | null = null
    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        let imageUrl: string

        if (selectedProvider === 'openai') {
          imageUrl = await this.generateWithOpenAI(prompt, size, quality)
        } else {
          imageUrl = await this.generateWithAnthropic(prompt)
        }

        return {
          imageUrl,
          prompt,
          provider: selectedProvider,
        }
      } catch (error) {
        lastError = error as Error
        console.error(`Image generation attempt ${attempt} failed:`, error)

        // If this is not the last attempt, wait before retrying
        if (attempt < this.MAX_RETRIES) {
          const delay = this.RETRY_DELAY_MS * Math.pow(2, attempt - 1) // Exponential backoff
          await this.sleep(delay)
        }
      }
    }

    // All retries failed
    throw new ImageGenerationError(
      `Failed to generate image after ${this.MAX_RETRIES} attempts: ${lastError?.message || 'Unknown error'}`
    )
  }

  /**
   * Generate image using OpenAI DALL-E
   */
  private async generateWithOpenAI(
    prompt: string,
    size: '1024x1024' | '1792x1024' | '1024x1792',
    quality: 'standard' | 'hd'
  ): Promise<string> {
    if (!this.openai) {
      throw new ImageGenerationError('OpenAI API key not configured')
    }

    try {
      const response = await this.openai.images.generate({
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
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new ImageGenerationError(`OpenAI generation failed: ${message}`)
    }
  }

  /**
   * Generate image using Anthropic Claude (placeholder - Anthropic doesn't have direct image generation)
   * In a real implementation, you might use Claude to enhance the prompt and then use another service
   */
  private async generateWithAnthropic(prompt: string): Promise<string> {
    if (!this.anthropic) {
      throw new ImageGenerationError('Anthropic API key not configured')
    }

    // Note: Anthropic doesn't have native image generation
    // This is a placeholder that would need to be implemented with a different approach
    // For now, fall back to OpenAI if available
    if (this.openai) {
      console.warn('Anthropic image generation not available, falling back to OpenAI')
      return this.generateWithOpenAI(prompt, '1024x1024', 'standard')
    }

    throw new ImageGenerationError('Anthropic image generation not implemented')
  }

  /**
   * Upload an image from a URL (e.g., AI-generated image) to Supabase Storage
   * This is useful for persisting AI-generated images that might have temporary URLs
   */
  async uploadImageFromUrl(imageUrl: string, storyStackId: string): Promise<string> {
    try {
      // Fetch the image
      const response = await fetch(imageUrl)
      if (!response.ok) {
        throw new ImageUploadError(`Failed to fetch image: ${response.statusText}`)
      }

      // Convert to buffer
      const arrayBuffer = await response.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      // Validate size
      const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
      if (buffer.length > MAX_FILE_SIZE) {
        throw new ImageUploadError('Image file size must be less than 5MB')
      }

      // Determine file extension from content type
      const contentType = response.headers.get('content-type') || 'image/png'
      const ext = contentType.split('/')[1] || 'png'

      // Generate unique filename
      const fileName = `${storyStackId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .upload(fileName, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        throw new ImageUploadError(`Upload failed: ${error.message}`)
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .getPublicUrl(data.path)

      return urlData.publicUrl
    } catch (error) {
      if (error instanceof ImageUploadError) throw error
      throw new ImageUploadError(`Failed to upload image from URL: ${(error as Error).message}`)
    }
  }

  /**
   * Delete an image from Supabase Storage
   */
  async deleteImage(imageUrl: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split(`/${this.STORAGE_BUCKET}/`)
      
      if (pathParts.length < 2) {
        throw new ImageUploadError('Invalid image URL format')
      }

      const filePath = pathParts[1]

      // Delete from storage
      const { error } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove([filePath])

      if (error) {
        throw new ImageUploadError(`Delete failed: ${error.message}`)
      }
    } catch (error) {
      if (error instanceof ImageUploadError) throw error
      throw new ImageUploadError(`Failed to delete image: ${(error as Error).message}`)
    }
  }

  /**
   * Delete all images for a story stack
   * Called when a story stack is deleted
   */
  async deleteStoryImages(storyStackId: string): Promise<void> {
    try {
      // List all files in the story stack folder
      const { data: files, error: listError } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .list(storyStackId)

      if (listError) {
        throw new ImageUploadError(`Failed to list images: ${listError.message}`)
      }

      if (!files || files.length === 0) {
        return // No images to delete
      }

      // Delete all files
      const filePaths = files.map(file => `${storyStackId}/${file.name}`)
      const { error: deleteError } = await this.supabase.storage
        .from(this.STORAGE_BUCKET)
        .remove(filePaths)

      if (deleteError) {
        throw new ImageUploadError(`Failed to delete images: ${deleteError.message}`)
      }
    } catch (error) {
      if (error instanceof ImageUploadError) throw error
      throw new ImageUploadError(`Failed to delete story images: ${(error as Error).message}`)
    }
  }

  /**
   * Helper method to sleep for a specified duration
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}
