import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
  StoryStack,
  StoryCard,
  Choice,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  StoryNotFoundError,
  DatabaseError,
  mapStoryStack,
  mapStoryCards,
  mapChoices,
} from './types'

export class PublishingService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient()
  }

  async publishStoryStack(id: string): Promise<StoryStack> {
    try {
      const stack = await this.getStoryStack(id)
      if (!stack) throw new StoryNotFoundError(id)

      const cards = await this.getStoryCards(id)
      if (cards.length === 0) {
        throw new DatabaseError('Cannot publish story with no cards')
      }

      // Use the story ID directly as slug for guaranteed uniqueness
      const slug = id

      const updateData: any = {
        is_published: true,
        slug,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await (this.supabase
        .from('story_stacks') as any)
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
      throw new DatabaseError('Failed to publish story stack')
    }
  }

  async unpublishStoryStack(id: string): Promise<StoryStack> {
    try {
      const updateData: any = {
        is_published: false,
        published_at: null,
        updated_at: new Date().toISOString(),
      }

      const { data, error } = await (this.supabase
        .from('story_stacks') as any)
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
      throw new DatabaseError('Failed to unpublish story stack')
    }
  }

  async generateSlug(name: string): Promise<string> {
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')

    if (!baseSlug) {
      baseSlug = 'story'
    }

    let slug = baseSlug
    let counter = 1

    while (true) {
      const { data, error } = await this.supabase
        .from('story_stacks')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (error && error.code !== 'PGRST116') {
        throw new DatabaseError(error.message)
      }

      if (!data) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  async validateStoryGraph(storyStackId: string): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []

      const stack = await this.getStoryStack(storyStackId)
      if (!stack) {
        throw new StoryNotFoundError(storyStackId)
      }

      const cards = await this.getStoryCards(storyStackId)
      
      if (cards.length === 0) {
        errors.push({
          type: 'missing_first_card',
          cardId: storyStackId,
          message: 'Story has no cards',
        })
        return { isValid: false, errors, warnings }
      }

      const allChoices: Choice[] = []
      for (const card of cards) {
        const choices = await this.getChoices(card.id)
        allChoices.push(...choices)
      }

      const cardsWithIncomingLinks = new Set<string>()
      
      if (stack.firstCardId) {
        cardsWithIncomingLinks.add(stack.firstCardId)
      }

      for (const choice of allChoices) {
        cardsWithIncomingLinks.add(choice.targetCardId)
      }

      for (const card of cards) {
        if (!cardsWithIncomingLinks.has(card.id) && card.id !== stack.firstCardId) {
          errors.push({
            type: 'orphaned_card',
            cardId: card.id,
            message: `Card "${card.title}" has no incoming links and is not the first card`,
          })
        }
      }

      for (const card of cards) {
        const cardChoices = allChoices.filter(c => c.storyCardId === card.id)
        
        if (cardChoices.length === 0) {
          warnings.push({
            type: 'no_choices',
            cardId: card.id,
            message: `Card "${card.title}" has no choices (story ending)`,
          })
        } else if (cardChoices.length === 1) {
          warnings.push({
            type: 'single_choice',
            cardId: card.id,
            message: `Card "${card.title}" has only one choice`,
          })
        }
      }

      const cardIds = new Set(cards.map(c => c.id))
      for (const choice of allChoices) {
        if (!cardIds.has(choice.targetCardId)) {
          errors.push({
            type: 'invalid_target',
            cardId: choice.storyCardId,
            message: `Choice "${choice.label}" points to non-existent card`,
          })
        }
      }

      if (!stack.firstCardId) {
        errors.push({
          type: 'missing_first_card',
          cardId: storyStackId,
          message: 'Story has no first card set',
        })
      } else if (!cardIds.has(stack.firstCardId)) {
        errors.push({
          type: 'invalid_target',
          cardId: storyStackId,
          message: 'First card does not exist',
        })
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
      }
    } catch (error) {
      if (error instanceof StoryNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to validate story graph')
    }
  }

  // Helper methods for internal use
  private async getStoryStack(id: string): Promise<StoryStack | null> {
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
  }

  private async getStoryCards(storyStackId: string): Promise<StoryCard[]> {
    const { data, error } = await this.supabase
      .from('story_cards')
      .select('*')
      .eq('story_stack_id', storyStackId)
      .order('order_index', { ascending: true })

    if (error) throw new DatabaseError(error.message)
    return mapStoryCards(data || [])
  }

  private async getChoices(storyCardId: string): Promise<Choice[]> {
    const { data, error } = await this.supabase
      .from('choices')
      .select('*')
      .eq('story_card_id', storyCardId)
      .order('order_index', { ascending: true })

    if (error) throw new DatabaseError(error.message)
    return mapChoices(data || [])
  }
}
