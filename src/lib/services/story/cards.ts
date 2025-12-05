import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import type { StoryCardInsert, StoryCardUpdate, ChoiceUpdate } from '@/lib/supabase/database.types'
import {
  StoryCard,
  Choice,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
  CardNotFoundError,
  ChoiceNotFoundError,
  DatabaseError,
  StaleVersionError,
  mapStoryCard,
  mapStoryCards,
  mapChoice,
  mapChoices,
} from './types'

export class CardsService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  // ============================================================================
  // Story Card Operations
  // ============================================================================

  async getStoryCards(storyStackId: string): Promise<StoryCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_cards')
        .select('*')
        .eq('story_stack_id', storyStackId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return mapStoryCards(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story cards')
    }
  }

  async getStoryCard(id: string): Promise<StoryCard | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_cards')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }

      return mapStoryCard(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story card')
    }
  }

  async createStoryCard(input: CreateStoryCardInput): Promise<StoryCard> {
    try {
      const { data: maxOrderData } = await this.supabase
        .from('story_cards')
        .select('order_index')
        .eq('story_stack_id', input.storyStackId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextOrderIndex = input.orderIndex !== undefined
        ? input.orderIndex
        : maxOrderData
          ? maxOrderData.order_index + 1
          : 0

      // Build insert data with proper typing
      const insertData: StoryCardInsert = {
        story_stack_id: input.storyStackId,
        title: input.title || 'Untitled Card',
        content: input.content || '',
        script: input.script || '',
        order_index: nextOrderIndex,
      }

      // Only add optional fields if they are explicitly provided
      if (input.imageUrl !== undefined) insertData.image_url = input.imageUrl
      if (input.imagePrompt !== undefined) insertData.image_prompt = input.imagePrompt
      if (input.audioUrl !== undefined) insertData.audio_url = input.audioUrl
      if (input.message !== undefined) insertData.message = input.message
      if (input.speaker !== undefined) insertData.speaker = input.speaker

      const { data, error } = await this.supabase
        .from('story_cards')
        .insert(insertData)
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapStoryCard(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create story card')
    }
  }

  async updateStoryCard(id: string, input: UpdateStoryCardInput): Promise<StoryCard> {
    try {
      const updateData: StoryCardUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (input.title !== undefined) updateData.title = input.title
      if (input.content !== undefined) updateData.content = input.content
      if (input.script !== undefined) updateData.script = input.script
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl
      if (input.imagePrompt !== undefined) updateData.image_prompt = input.imagePrompt
      if (input.imageDescription !== undefined) updateData.image_description = input.imageDescription
      if (input.audioUrl !== undefined) updateData.audio_url = input.audioUrl
      if (input.message !== undefined) updateData.message = input.message
      if (input.speaker !== undefined) updateData.speaker = input.speaker
      if ((input as { speakerType?: string }).speakerType !== undefined) updateData.speaker_type = (input as { speakerType: string }).speakerType
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      // If version is provided, use optimistic concurrency control
      if (input.version !== undefined) {
        // First, check the current version
        const { data: currentCard, error: fetchError } = await this.supabase
          .from('story_cards')
          .select('version')
          .eq('id', id)
          .single()

        if (fetchError) {
          if (fetchError.code === 'PGRST116') throw new CardNotFoundError(id)
          throw new DatabaseError(fetchError.message)
        }

        const actualVersion = currentCard?.version ?? 1
        if (actualVersion !== input.version) {
          throw new StaleVersionError(id, input.version, actualVersion)
        }
      }

      const { data, error } = await this.supabase
        .from('story_cards')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new CardNotFoundError(id)
        throw new DatabaseError(error.message)
      }

      return mapStoryCard(data)
    } catch (error) {
      if (error instanceof CardNotFoundError || error instanceof DatabaseError || error instanceof StaleVersionError) throw error
      throw new DatabaseError('Failed to update story card')
    }
  }

  async deleteStoryCard(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('story_cards')
        .delete()
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete story card')
    }
  }

  // ============================================================================
  // Choice Operations
  // ============================================================================

  async getChoices(storyCardId: string): Promise<Choice[]> {
    try {
      const { data, error } = await this.supabase
        .from('choices')
        .select('*')
        .eq('story_card_id', storyCardId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return mapChoices(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch choices')
    }
  }

  async createChoice(input: CreateChoiceInput): Promise<Choice> {
    try {
      const { data: maxOrderData } = await this.supabase
        .from('choices')
        .select('order_index')
        .eq('story_card_id', input.storyCardId)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()

      const nextOrderIndex = input.orderIndex !== undefined
        ? input.orderIndex
        : maxOrderData
          ? maxOrderData.order_index + 1
          : 0

      const { data, error } = await this.supabase
        .from('choices')
        .insert({
          story_card_id: input.storyCardId,
          label: input.label,
          target_card_id: input.targetCardId,
          order_index: nextOrderIndex,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapChoice(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create choice')
    }
  }

  async updateChoice(id: string, input: UpdateChoiceInput): Promise<Choice> {
    try {
      const updateData: ChoiceUpdate = {
        updated_at: new Date().toISOString(),
      }

      if (input.label !== undefined) updateData.label = input.label
      if (input.targetCardId !== undefined) updateData.target_card_id = input.targetCardId
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      const { data, error } = await this.supabase
        .from('choices')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new ChoiceNotFoundError(id)
        throw new DatabaseError(error.message)
      }

      return mapChoice(data)
    } catch (error) {
      if (error instanceof ChoiceNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update choice')
    }
  }

  async deleteChoice(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('choices')
        .delete()
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete choice')
    }
  }
}
