// Re-export types
export type { GenerateImageOptions, ImageGenerationResult } from './types'
export { STORAGE_BUCKET, MAX_FILE_SIZE, MAX_RETRIES, RETRY_DELAY_MS, ALLOWED_TYPES } from './types'

// Re-export processing functions
export { generateImage, generateWithOpenAI, generateWithAnthropic, openai, anthropic } from './processing'

// Re-export upload functions
export { uploadImage, uploadImageFromUrl } from './upload'

// Re-export storage functions
export { deleteImage, deleteStoryImages } from './storage'

// Re-export ImageService class for backward compatibility
import { createClient } from '@/lib/supabase/client'
import { ImageGenerationError, ImageUploadError } from '@/lib/types'
import { GenerateImageOptions, ImageGenerationResult } from './types'
import { generateImage } from './processing'
import { uploadImage, uploadImageFromUrl } from './upload'
import { deleteImage, deleteStoryImages } from './storage'

export class ImageService {
  private supabase = createClient()

  async generateImage(options: GenerateImageOptions): Promise<ImageGenerationResult> {
    return generateImage(options)
  }

  async uploadImage(file: File, storyStackId: string): Promise<string> {
    return uploadImage(file, storyStackId)
  }

  async uploadImageFromUrl(imageUrl: string, storyStackId: string): Promise<string> {
    return uploadImageFromUrl(imageUrl, storyStackId)
  }

  async deleteImage(imageUrl: string): Promise<void> {
    return deleteImage(imageUrl)
  }

  async deleteStoryImages(storyStackId: string): Promise<void> {
    return deleteStoryImages(storyStackId)
  }
}
