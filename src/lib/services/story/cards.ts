import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
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
          ? (maxOrderData as any).order_index + 1 
          : 0

      const { data, error } = await (this.supabase
        .from('story_cards') as any)
        .insert({
          story_stack_id: input.storyStackId,
          title: input.title || 'Untitled Card',
          content: input.content || '',
          script: input.script || '',
          image_url: input.imageUrl || null,
          image_prompt: input.imagePrompt || null,
          message: input.message || null,
          speaker: input.speaker || null,
          order_index: nextOrderIndex,
        })
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
      const updateData: any = {}

      if (input.title !== undefined) updateData.title = input.title
      if (input.content !== undefined) updateData.content = input.content
      if (input.script !== undefined) updateData.script = input.script
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl
      if (input.imagePrompt !== undefined) updateData.image_prompt = input.imagePrompt
      if (input.message !== undefined) updateData.message = input.message
      if (input.speaker !== undefined) updateData.speaker = input.speaker
      if ((input as any).speakerType !== undefined) updateData.speaker_type = (input as any).speakerType
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await (this.supabase
        .from('story_cards') as any)
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
      if (error instanceof CardNotFoundError || error instanceof DatabaseError) throw error
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
          ? (maxOrderData as any).order_index + 1 
          : 0

      const { data, error } = await (this.supabase
        .from('choices') as any)
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
      const updateData: any = {}
      
      if (input.label !== undefined) updateData.label = input.label
      if (input.targetCardId !== undefined) updateData.target_card_id = input.targetCardId
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await (this.supabase
        .from('choices') as any)
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
