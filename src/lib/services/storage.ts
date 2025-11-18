import { createClient } from '@/lib/supabase/client'

export interface UploadMediaResult {
  url: string
  path: string
  type: 'image' | 'video'
}

export class StorageService {
  private supabase = createClient()
  private bucketName = 'media-uploads'

  /**
   * Upload an image or video file to Supabase Storage
   * @param file - The file to upload
   * @param stackId - The stack ID to organize uploads
   * @returns The public URL of the uploaded file
   */
  async uploadMedia(file: File, stackId: string): Promise<UploadMediaResult> {
    // Validate file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')

    if (!isImage && !isVideo) {
      throw new Error('Only image and video files are supported')
    }

    // Validate file size (max 50MB for images, 100MB for videos)
    const maxSize = isImage ? 50 * 1024 * 1024 : 100 * 1024 * 1024
    if (file.size > maxSize) {
      const maxSizeMB = isImage ? 50 : 100
      throw new Error(`File size exceeds ${maxSizeMB}MB limit`)
    }

    // Generate unique file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const filePath = `${stackId}/${timestamp}-${sanitizedFileName}`

    // Upload to Supabase Storage
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw new Error(`Upload failed: ${error.message}`)
    }

    // Get public URL
    const { data: { publicUrl } } = this.supabase.storage
      .from(this.bucketName)
      .getPublicUrl(data.path)

    return {
      url: publicUrl,
      path: data.path,
      type: isImage ? 'image' : 'video',
    }
  }

  /**
   * Delete a media file from Supabase Storage
   * @param path - The file path to delete
   */
  async deleteMedia(path: string): Promise<void> {
    const { error } = await this.supabase.storage
      .from(this.bucketName)
      .remove([path])

    if (error) {
      throw new Error(`Delete failed: ${error.message}`)
    }
  }

  /**
   * List all media files for a stack
   * @param stackId - The stack ID
   */
  async listStackMedia(stackId: string): Promise<string[]> {
    const { data, error } = await this.supabase.storage
      .from(this.bucketName)
      .list(stackId)

    if (error) {
      throw new Error(`Failed to list files: ${error.message}`)
    }

    return data.map(file => `${stackId}/${file.name}`)
  }
}
