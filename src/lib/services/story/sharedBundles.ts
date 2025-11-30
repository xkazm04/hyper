// Shared Story Bundles Service
// Handles creating and retrieving shareable story bundle URLs

import { SupabaseClient } from '@supabase/supabase-js'
import type { CompiledStoryBundle } from '@/app/features/wasm-runtime/lib/types'

/**
 * Shared bundle record from database
 */
export interface SharedStoryBundle {
  id: string
  storyStackId: string
  userId: string
  shareCode: string
  bundleData: CompiledStoryBundle
  bundleVersion: string
  bundleChecksum: string
  bundleSizeBytes: number
  storyName: string
  storyDescription: string | null
  cardCount: number
  choiceCount: number
  characterCount: number
  viewCount: number
  createdAt: string
  updatedAt: string
  expiresAt: string | null
  isActive: boolean
}

/**
 * Input for creating a shared bundle
 */
export interface CreateSharedBundleInput {
  storyStackId: string
  bundleData: CompiledStoryBundle
  bundleVersion: string
  bundleChecksum: string
  bundleSizeBytes: number
  storyName: string
  storyDescription?: string | null
  cardCount: number
  choiceCount: number
  characterCount: number
  expiresAt?: string | null
}

/**
 * Database row shape
 */
interface SharedBundleRow {
  id: string
  story_stack_id: string
  user_id: string
  share_code: string
  bundle_data: CompiledStoryBundle
  bundle_version: string
  bundle_checksum: string
  bundle_size_bytes: number
  story_name: string
  story_description: string | null
  card_count: number
  choice_count: number
  character_count: number
  view_count: number
  created_at: string
  updated_at: string
  expires_at: string | null
  is_active: boolean
}

/**
 * Service for managing shared story bundles
 */
export class SharedBundlesService {
  constructor(private supabase: SupabaseClient) {}

  /**
   * Create a new shared bundle with a unique share code
   */
  async createSharedBundle(input: CreateSharedBundleInput): Promise<SharedStoryBundle> {
    // Generate a unique share code
    const shareCode = this.generateShareCode()

    const { data, error } = await this.supabase
      .from('shared_story_bundles')
      .insert({
        story_stack_id: input.storyStackId,
        share_code: shareCode,
        bundle_data: input.bundleData,
        bundle_version: input.bundleVersion,
        bundle_checksum: input.bundleChecksum,
        bundle_size_bytes: input.bundleSizeBytes,
        story_name: input.storyName,
        story_description: input.storyDescription || null,
        card_count: input.cardCount,
        choice_count: input.choiceCount,
        character_count: input.characterCount,
        expires_at: input.expiresAt || null,
      })
      .select()
      .single()

    if (error) {
      // If share code collision, retry with new code
      if (error.code === '23505') {
        return this.createSharedBundle(input)
      }
      throw new Error(`Failed to create shared bundle: ${error.message}`)
    }

    return this.mapRow(data as SharedBundleRow)
  }

  /**
   * Get a shared bundle by share code (public access)
   */
  async getSharedBundleByCode(shareCode: string): Promise<SharedStoryBundle | null> {
    const { data, error } = await this.supabase
      .from('shared_story_bundles')
      .select('*')
      .eq('share_code', shareCode)
      .eq('is_active', true)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to get shared bundle: ${error.message}`)
    }

    // Check expiration
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    return this.mapRow(data as SharedBundleRow)
  }

  /**
   * Get all shared bundles for a user
   */
  async getUserSharedBundles(userId: string): Promise<SharedStoryBundle[]> {
    const { data, error } = await this.supabase
      .from('shared_story_bundles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get user shared bundles: ${error.message}`)
    }

    return (data as SharedBundleRow[]).map(this.mapRow)
  }

  /**
   * Get shared bundles for a specific story
   */
  async getStorySharedBundles(storyStackId: string): Promise<SharedStoryBundle[]> {
    const { data, error } = await this.supabase
      .from('shared_story_bundles')
      .select('*')
      .eq('story_stack_id', storyStackId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to get story shared bundles: ${error.message}`)
    }

    return (data as SharedBundleRow[]).map(this.mapRow)
  }

  /**
   * Increment view count for a shared bundle
   */
  async incrementViewCount(shareCode: string): Promise<void> {
    const { error } = await this.supabase.rpc('increment_view_count', {
      code: shareCode,
    })

    // Fallback if RPC doesn't exist
    if (error) {
      await this.supabase
        .from('shared_story_bundles')
        .update({ view_count: this.supabase.rpc('view_count + 1') })
        .eq('share_code', shareCode)
    }
  }

  /**
   * Deactivate a shared bundle
   */
  async deactivateSharedBundle(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('shared_story_bundles')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to deactivate shared bundle: ${error.message}`)
    }
  }

  /**
   * Delete a shared bundle permanently
   */
  async deleteSharedBundle(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('shared_story_bundles')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete shared bundle: ${error.message}`)
    }
  }

  /**
   * Generate a unique alphanumeric share code
   */
  private generateShareCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars[Math.floor(Math.random() * chars.length)]
    }
    return result
  }

  /**
   * Map database row to SharedStoryBundle
   */
  private mapRow(row: SharedBundleRow): SharedStoryBundle {
    return {
      id: row.id,
      storyStackId: row.story_stack_id,
      userId: row.user_id,
      shareCode: row.share_code,
      bundleData: row.bundle_data,
      bundleVersion: row.bundle_version,
      bundleChecksum: row.bundle_checksum,
      bundleSizeBytes: row.bundle_size_bytes,
      storyName: row.story_name,
      storyDescription: row.story_description,
      cardCount: row.card_count,
      choiceCount: row.choice_count,
      characterCount: row.character_count,
      viewCount: row.view_count,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      expiresAt: row.expires_at,
      isActive: row.is_active,
    }
  }
}
