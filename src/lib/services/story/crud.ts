import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { StoryStackRow, StoryStackUpdate } from '@/lib/supabase/database.types'
import {
  StoryStack,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  StoryNotFoundError,
  DatabaseError,
  mapStoryStack,
  mapStoryStacks,
} from './types'

export class StoryCrudService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async getStoryStacks(userId?: string): Promise<StoryStack[]> {
    try {
      let query = this.supabase
        .from('story_stacks')
        .select('*')
        .order('updated_at', { ascending: false })

      if (userId) {
        query = query.eq('owner_id', userId)
      }

      const { data, error } = await query

      if (error) throw new DatabaseError(error.message)
      return mapStoryStacks(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story stacks')
    }
  }

  async getStoryStack(id: string): Promise<StoryStack | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_stacks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }

      return mapStoryStack(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story stack')
    }
  }

  async getPublishedStoryStack(slug: string): Promise<StoryStack | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_stacks')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }

      return mapStoryStack(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch published story stack')
    }
  }

  async createStoryStack(input: CreateStoryStackInput): Promise<StoryStack> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await this.supabase
        .from('story_stacks')
        .insert({
          owner_id: user.id,
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapStoryStack(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create story stack')
    }
  }

  async updateStoryStack(id: string, input: UpdateStoryStackInput): Promise<StoryStack> {
    try {
      const updateData: StoryStackUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.isPublished !== undefined) updateData.is_published = input.isPublished
      if (input.slug !== undefined) updateData.slug = input.slug
      if (input.firstCardId !== undefined) updateData.first_card_id = input.firstCardId
      if (input.coverImageUrl !== undefined) updateData.cover_image_url = input.coverImageUrl

      const { data, error } = await this.supabase
        .from('story_stacks')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new StoryNotFoundError(id)
        throw new DatabaseError(error.message)
      }

      return mapStoryStack(data)
    } catch (error) {
      if (error instanceof StoryNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update story stack')
    }
  }

  async deleteStoryStack(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('story_stacks')
        .delete()
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete story stack')
    }
  }
}
