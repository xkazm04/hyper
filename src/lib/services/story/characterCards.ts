import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  CharacterCard,
  CreateCharacterCardInput,
  UpdateCharacterCardInput,
  CharacterCardNotFoundError,
  DatabaseError,
  mapCharacterCard,
  mapCharacterCards,
} from './types'

export class CharacterCardsService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  // ============================================================================
  // Character Card Operations
  // ============================================================================

  async getCharacterCards(storyStackId: string): Promise<CharacterCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('character_cards')
        .select('*')
        .eq('story_stack_id', storyStackId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return mapCharacterCards(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch character cards')
    }
  }

  async getCharacterCard(id: string): Promise<CharacterCard | null> {
    try {
      const { data, error } = await this.supabase
        .from('character_cards')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw new DatabaseError(error.message)
      }

      return mapCharacterCard(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch character card')
    }
  }

  async getCharacterCardsByCharacter(characterId: string): Promise<CharacterCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('character_cards')
        .select('*')
        .eq('character_id', characterId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return mapCharacterCards(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch character cards by character')
    }
  }

  async createCharacterCard(input: CreateCharacterCardInput): Promise<CharacterCard> {
    try {
      const { data: maxOrderData } = await this.supabase
        .from('character_cards')
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
        .from('character_cards') as any)
        .insert({
          story_stack_id: input.storyStackId,
          character_id: input.characterId,
          title: input.title || null,
          content: input.content || null,
          image_index: input.imageIndex ?? 0,
          show_avatar: input.showAvatar ?? false,
          order_index: nextOrderIndex,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return mapCharacterCard(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create character card')
    }
  }

  async updateCharacterCard(id: string, input: UpdateCharacterCardInput): Promise<CharacterCard> {
    try {
      const updateData: any = {}

      if (input.characterId !== undefined) updateData.character_id = input.characterId
      if (input.title !== undefined) updateData.title = input.title
      if (input.content !== undefined) updateData.content = input.content
      if (input.imageIndex !== undefined) updateData.image_index = input.imageIndex
      if (input.showAvatar !== undefined) updateData.show_avatar = input.showAvatar
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      updateData.updated_at = new Date().toISOString()

      const { data, error } = await (this.supabase
        .from('character_cards') as any)
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST116') throw new CharacterCardNotFoundError(id)
        throw new DatabaseError(error.message)
      }

      return mapCharacterCard(data)
    } catch (error) {
      if (error instanceof CharacterCardNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update character card')
    }
  }

  async deleteCharacterCard(id: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('character_cards')
        .delete()
        .eq('id', id)

      if (error) throw new DatabaseError(error.message)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to delete character card')
    }
  }
}
