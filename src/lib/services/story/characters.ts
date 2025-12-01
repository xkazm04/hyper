import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  Character,
  CreateCharacterInput,
  UpdateCharacterInput,
  CharacterNotFoundError,
  DatabaseError,
  mapCharacter,
  mapCharacters,
} from './types'

export class CharactersService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async getCharacters(storyStackId: string): Promise<Character[]> {
    try {
      const { data, error } = await this.supabase
        .from('characters')
        .select('*')
        .eq('story_stack_id', storyStackId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return mapCharacters(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch characters')
    }
  }

  async getCharacter(id: string): Promise<Character | null> {
    try {
      const { data, error } = await this.supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }

      return mapCharacter(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch character')
    }
  }

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    try {
      const { data: maxOrderData } = await this.supabase
        .from('characters')
        .select('order_index')
        .eq('story_stack_id', input.storyStackId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextOrderIndex = input.orderIndex !== undefined
        ? input.orderIndex
        : maxOrderData
          ? (maxOrderData as any).order_index + 1
          : 0

      const { data, error } = await (this.supabase
        .from('characters') as any)
        .insert({
          story_stack_id: input.storyStackId,
          name: input.name,
          appearance: input.appearance || '',
          image_urls: input.imageUrls || [],
          image_prompts: input.imagePrompts || [],
          avatar_url: input.avatarUrl || null,
          avatar_prompt: input.avatarPrompt || null,
          order_index: nextOrderIndex,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapCharacter(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create character')
    }
  }

  async updateCharacter(id: string, input: UpdateCharacterInput): Promise<Character> {
    try {
      const updateData: any = {}

      if (input.name !== undefined) updateData.name = input.name
      if (input.appearance !== undefined) updateData.appearance = input.appearance
      if (input.imageUrls !== undefined) updateData.image_urls = input.imageUrls
      if (input.imagePrompts !== undefined) updateData.image_prompts = input.imagePrompts
      if (input.avatarUrl !== undefined) updateData.avatar_url = input.avatarUrl
      if (input.avatarPrompt !== undefined) updateData.avatar_prompt = input.avatarPrompt
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex
      // Bria training fields
      if (input.briaProjectId !== undefined) updateData.bria_project_id = input.briaProjectId
      if (input.briaDatasetId !== undefined) updateData.bria_dataset_id = input.briaDatasetId
      if (input.briaModelId !== undefined) updateData.bria_model_id = input.briaModelId
      if (input.briaModelStatus !== undefined) updateData.bria_model_status = input.briaModelStatus
      if (input.briaCaptionPrefix !== undefined) updateData.bria_caption_prefix = input.briaCaptionPrefix
      if (input.briaTrainingStartedAt !== undefined) updateData.bria_training_started_at = input.briaTrainingStartedAt
      if (input.briaTrainingCompletedAt !== undefined) updateData.bria_training_completed_at = input.briaTrainingCompletedAt

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await (this.supabase
        .from('characters') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new CharacterNotFoundError(id)
        throw new DatabaseError(error.message)
      }

      return mapCharacter(data)
    } catch (error) {
      if (error instanceof CharacterNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update character')
    }
  }

  async deleteCharacter(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('characters')
        .delete()
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete character')
    }
  }
}
