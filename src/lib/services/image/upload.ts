/**
 * Image Upload - File upload utilities
 */

import { createClient } from '@/lib/supabase/client'
import { ImageUploadError } from '@/lib/types'
import { STORAGE_BUCKET, MAX_FILE_SIZE, ALLOWED_TYPES } from './types'

const supabase = createClient()

/**
 * Upload an image file to Supabase Storage
 * Accepts images up to 5MB in JPEG, PNG, or WebP format
 */
export async function uploadImage(file: File, storyStackId: string): Promise<string> {
  try {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      throw new ImageUploadError('Image file size must be less than 5MB')
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new ImageUploadError('Image must be in JPEG, PNG, or WebP format')
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${storyStackId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new ImageUploadError(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    if (error instanceof ImageUploadError) throw error
    throw new ImageUploadError(`Failed to upload image: ${(error as Error).message}`)
  }
}

/**
 * Upload an image from a URL to Supabase Storage
 * Useful for persisting AI-generated images with temporary URLs
 */
export async function uploadImageFromUrl(imageUrl: string, storyStackId: string): Promise<string> {
  try {
    // Fetch the image
    const response = await fetch(imageUrl)
    if (!response.ok) {
      throw new ImageUploadError(`Failed to fetch image: ${response.statusText}`)
    }

    // Convert to blob
    const blob = await response.blob()

    // Validate size
    if (blob.size > MAX_FILE_SIZE) {
      throw new ImageUploadError('Image file size must be less than 5MB')
    }

    // Determine file extension from content type
    const contentType = response.headers.get('content-type') || 'image/png'
    const ext = contentType.split('/')[1] || 'png'

    // Generate unique filename
    const fileName = `${storyStackId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(fileName, blob, {
        contentType,
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new ImageUploadError(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(data.path)

    return urlData.publicUrl
  } catch (error) {
    if (error instanceof ImageUploadError) throw error
    throw new ImageUploadError(`Failed to upload image from URL: ${(error as Error).message}`)
  }
}
