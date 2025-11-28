/**
 * Image Storage - Delete and management operations
 */

import { createClient } from '@/lib/supabase/client'
import { ImageUploadError } from '@/lib/types'
import { STORAGE_BUCKET } from './types'

const supabase = createClient()

/**
 * Delete an image from Supabase Storage
 */
export async function deleteImage(imageUrl: string): Promise<void> {
  try {
    // Extract the file path from the URL
    const url = new URL(imageUrl)
    const pathParts = url.pathname.split(`/${STORAGE_BUCKET}/`)
    
    if (pathParts.length < 2) {
      throw new ImageUploadError('Invalid image URL format')
    }

    const filePath = pathParts[1]

    // Delete from storage
    const { error } = await supabase.storage
      .from(STORAGE_BUCKET)
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
export async function deleteStoryImages(storyStackId: string): Promise<void> {
  try {
    // List all files in the story stack folder
    const { data: files, error: listError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .list(storyStackId)

    if (listError) {
      throw new ImageUploadError(`Failed to list images: ${listError.message}`)
    }

    if (!files || files.length === 0) {
      return // No images to delete
    }

    // Delete all files
    const filePaths = files.map(file => `${storyStackId}/${file.name}`)
    const { error: deleteError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .remove(filePaths)

    if (deleteError) {
      throw new ImageUploadError(`Failed to delete images: ${deleteError.message}`)
    }
  } catch (error) {
    if (error instanceof ImageUploadError) throw error
    throw new ImageUploadError(`Failed to delete story images: ${(error as Error).message}`)
  }
}
