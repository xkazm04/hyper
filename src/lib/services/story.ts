import { createClient } from '@/lib/supabase/client'
import { SupabaseClient } from '@supabase/supabase-js'
import {
  StoryStack,
  StoryCard,
  Choice,
  Character,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
  CreateCharacterInput,
  UpdateCharacterInput,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  StoryNotFoundError,
  CardNotFoundError,
  ChoiceNotFoundError,
  CharacterNotFoundError,
  DatabaseError,
} from '@/lib/types'

export class StoryService {
  private supabase: SupabaseClient

  constructor(supabaseClient?: SupabaseClient) {
    // Use provided client (for server-side) or create browser client (for client-side)
    this.supabase = supabaseClient || createClient()
  }

  // ============================================================================
  // Story Stack Operations
  // ============================================================================

  /**
   * Get all story stacks for the current user
   */
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
      return this.mapStoryStacks(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story stacks')
    }
  }

  /**
   * Get a single story stack by ID
   */
  async getStoryStack(id: string): Promise<StoryStack | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_stacks')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new DatabaseError(error.message)
      }

      return this.mapStoryStack(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story stack')
    }
  }

  /**
   * Get a published story stack by slug
   */
  async getPublishedStoryStack(slug: string): Promise<StoryStack | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_stacks')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new DatabaseError(error.message)
      }

      return this.mapStoryStack(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch published story stack')
    }
  }

  /**
   * Create a new story stack
   */
  async createStoryStack(input: CreateStoryStackInput): Promise<StoryStack> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser()
      if (!user) throw new DatabaseError('Not authenticated')

      const { data, error } = await (this.supabase
        .from('story_stacks') as any)
        .insert({
          owner_id: user.id,
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return this.mapStoryStack(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create story stack')
    }
  }

  /**
   * Update a story stack
   */
  async updateStoryStack(id: string, input: UpdateStoryStackInput): Promise<StoryStack> {
    try {
      const updateData: any = {}
      
      if (input.name !== undefined) updateData.name = input.name
      if (input.description !== undefined) updateData.description = input.description
      if (input.isPublished !== undefined) updateData.is_published = input.isPublished
      if (input.slug !== undefined) updateData.slug = input.slug
      if (input.firstCardId !== undefined) updateData.first_card_id = input.firstCardId

      // Always update the updated_at timestamp
      updateData.updated_at = new Date().toISOString()

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

      return this.mapStoryStack(data)
    } catch (error) {
      if (error instanceof StoryNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update story stack')
    }
  }

  /**
   * Delete a story stack (cascade deletes cards and choices)
   */
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

  /**
   * Publish a story stack with a generated slug
   */
  async publishStoryStack(id: string): Promise<StoryStack> {
    try {
      // Get the story stack
      const stack = await this.getStoryStack(id)
      if (!stack) throw new StoryNotFoundError(id)

      // Validate that story has at least one card
      const cards = await this.getStoryCards(id)
      if (cards.length === 0) {
        throw new DatabaseError('Cannot publish story with no cards')
      }

      // Generate a unique slug
      const slug = await this.generateSlug(stack.name)

      // Update the stack with published status and timestamp
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

      return this.mapStoryStack(data)
    } catch (error) {
      if (error instanceof StoryNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to publish story stack')
    }
  }

  /**
   * Unpublish a story stack
   */
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

      return this.mapStoryStack(data)
    } catch (error) {
      if (error instanceof StoryNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to unpublish story stack')
    }
  }

  // ============================================================================
  // Story Card Operations
  // ============================================================================

  /**
   * Get all story cards for a story stack
   */
  async getStoryCards(storyStackId: string): Promise<StoryCard[]> {
    try {
      const { data, error } = await this.supabase
        .from('story_cards')
        .select('*')
        .eq('story_stack_id', storyStackId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return this.mapStoryCards(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story cards')
    }
  }

  /**
   * Get a single story card by ID
   */
  async getStoryCard(id: string): Promise<StoryCard | null> {
    try {
      const { data, error } = await this.supabase
        .from('story_cards')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new DatabaseError(error.message)
      }

      return this.mapStoryCard(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch story card')
    }
  }

  /**
   * Create a new story card
   */
  async createStoryCard(input: CreateStoryCardInput): Promise<StoryCard> {
    try {
      // Get the max order_index for this stack
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
          order_index: nextOrderIndex,
        })
        .select()
        .single()

      if (error) throw new DatabaseError(error.message)
      return this.mapStoryCard(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create story card')
    }
  }

  /**
   * Update a story card
   */
  async updateStoryCard(id: string, input: UpdateStoryCardInput): Promise<StoryCard> {
    try {
      const updateData: any = {}

      if (input.title !== undefined) updateData.title = input.title
      if (input.content !== undefined) updateData.content = input.content
      if (input.script !== undefined) updateData.script = input.script
      if (input.imageUrl !== undefined) updateData.image_url = input.imageUrl
      if (input.imagePrompt !== undefined) updateData.image_prompt = input.imagePrompt
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      // Always update the updated_at timestamp
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

      return this.mapStoryCard(data)
    } catch (error) {
      if (error instanceof CardNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update story card')
    }
  }

  /**
   * Delete a story card (cascade deletes choices)
   */
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

  /**
   * Get all choices for a story card
   */
  async getChoices(storyCardId: string): Promise<Choice[]> {
    try {
      const { data, error } = await this.supabase
        .from('choices')
        .select('*')
        .eq('story_card_id', storyCardId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return this.mapChoices(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch choices')
    }
  }

  /**
   * Create a new choice
   */
  async createChoice(input: CreateChoiceInput): Promise<Choice> {
    try {
      // Get the max order_index for this card
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
      return this.mapChoice(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create choice')
    }
  }

  /**
   * Update a choice
   */
  async updateChoice(id: string, input: UpdateChoiceInput): Promise<Choice> {
    try {
      const updateData: any = {}
      
      if (input.label !== undefined) updateData.label = input.label
      if (input.targetCardId !== undefined) updateData.target_card_id = input.targetCardId
      if (input.orderIndex !== undefined) updateData.order_index = input.orderIndex

      // Always update the updated_at timestamp
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

      return this.mapChoice(data)
    } catch (error) {
      if (error instanceof ChoiceNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update choice')
    }
  }

  /**
   * Delete a choice
   */
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

  // ============================================================================
  // Character Operations
  // ============================================================================

  /**
   * Get all characters for a story stack
   */
  async getCharacters(storyStackId: string): Promise<Character[]> {
    try {
      const { data, error } = await this.supabase
        .from('characters')
        .select('*')
        .eq('story_stack_id', storyStackId)
        .order('order_index', { ascending: true })

      if (error) throw new DatabaseError(error.message)
      return this.mapCharacters(data || [])
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch characters')
    }
  }

  /**
   * Get a single character by ID
   */
  async getCharacter(id: string): Promise<Character | null> {
    try {
      const { data, error } = await this.supabase
        .from('characters')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw new DatabaseError(error.message)
      }

      return this.mapCharacter(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to fetch character')
    }
  }

  /**
   * Create a new character
   */
  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    try {
      // Get the max order_index for this stack
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
      return this.mapCharacter(data)
    } catch (error) {
      if (error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to create character')
    }
  }

  /**
   * Update a character
   */
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

      // Always update the updated_at timestamp
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

      return this.mapCharacter(data)
    } catch (error) {
      if (error instanceof CharacterNotFoundError || error instanceof DatabaseError) throw error
      throw new DatabaseError('Failed to update character')
    }
  }

  /**
   * Delete a character
   */
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

  // ============================================================================
  // Utility Operations
  // ============================================================================

  /**
   * Generate a unique slug from a story name
   */
  async generateSlug(name: string): Promise<string> {
    // Convert to lowercase and replace spaces/special chars with hyphens
    let baseSlug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '') // Remove special characters
      .replace(/[\s_]+/g, '-')  // Replace spaces and underscores with hyphens
      .replace(/^-+|-+$/g, '')  // Remove leading/trailing hyphens

    // If slug is empty after sanitization, use a default
    if (!baseSlug) {
      baseSlug = 'story'
    }

    // Check if slug exists
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

      // If no existing slug found, we can use it
      if (!data) {
        return slug
      }

      // Otherwise, append a number and try again
      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  /**
   * Validate story graph structure
   * Detects orphaned cards (no incoming links) and dead ends (no outgoing choices)
   */
  async validateStoryGraph(storyStackId: string): Promise<ValidationResult> {
    try {
      const errors: ValidationError[] = []
      const warnings: ValidationWarning[] = []

      // Get the story stack
      const stack = await this.getStoryStack(storyStackId)
      if (!stack) {
        throw new StoryNotFoundError(storyStackId)
      }

      // Get all cards and choices
      const cards = await this.getStoryCards(storyStackId)
      
      if (cards.length === 0) {
        errors.push({
          type: 'missing_first_card',
          cardId: storyStackId,
          message: 'Story has no cards',
        })
        return { isValid: false, errors, warnings }
      }

      // Get all choices for all cards
      const allChoices: Choice[] = []
      for (const card of cards) {
        const choices = await this.getChoices(card.id)
        allChoices.push(...choices)
      }

      // Build a set of card IDs that have incoming links
      const cardsWithIncomingLinks = new Set<string>()
      
      // The first card always has an "incoming link" (it's the entry point)
      if (stack.firstCardId) {
        cardsWithIncomingLinks.add(stack.firstCardId)
      }

      // Add all target cards from choices
      for (const choice of allChoices) {
        cardsWithIncomingLinks.add(choice.targetCardId)
      }

      // Check for orphaned cards (no incoming links, except first card)
      for (const card of cards) {
        if (!cardsWithIncomingLinks.has(card.id) && card.id !== stack.firstCardId) {
          errors.push({
            type: 'orphaned_card',
            cardId: card.id,
            message: `Card "${card.title}" has no incoming links and is not the first card`,
          })
        }
      }

      // Check for dead ends (cards with no outgoing choices)
      for (const card of cards) {
        const cardChoices = allChoices.filter(c => c.storyCardId === card.id)
        
        if (cardChoices.length === 0) {
          // This is a dead end - could be intentional (story ending)
          warnings.push({
            type: 'no_choices',
            cardId: card.id,
            message: `Card "${card.title}" has no choices (story ending)`,
          })
        } else if (cardChoices.length === 1) {
          // Single choice - might want to warn about this
          warnings.push({
            type: 'single_choice',
            cardId: card.id,
            message: `Card "${card.title}" has only one choice`,
          })
        }
      }

      // Check for invalid target cards
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

      // Check if first card is set
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

  // ============================================================================
  // Private Mapping Methods
  // ============================================================================

  private mapStoryStack(data: any): StoryStack {
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      description: data.description,
      isPublished: data.is_published,
      publishedAt: data.published_at,
      slug: data.slug,
      firstCardId: data.first_card_id,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapStoryStacks(data: any[]): StoryStack[] {
    return data.map(d => this.mapStoryStack(d))
  }

  private mapStoryCard(data: any): StoryCard {
    return {
      id: data.id,
      storyStackId: data.story_stack_id,
      title: data.title,
      content: data.content,
      script: data.script || '',
      imageUrl: data.image_url,
      imagePrompt: data.image_prompt,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapStoryCards(data: any[]): StoryCard[] {
    return data.map(d => this.mapStoryCard(d))
  }

  private mapChoice(data: any): Choice {
    return {
      id: data.id,
      storyCardId: data.story_card_id,
      label: data.label,
      targetCardId: data.target_card_id,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapChoices(data: any[]): Choice[] {
    return data.map(d => this.mapChoice(d))
  }

  private mapCharacter(data: any): Character {
    return {
      id: data.id,
      storyStackId: data.story_stack_id,
      name: data.name,
      appearance: data.appearance,
      imageUrls: data.image_urls || [],
      imagePrompts: data.image_prompts || [],
      avatarUrl: data.avatar_url,
      avatarPrompt: data.avatar_prompt,
      orderIndex: data.order_index,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }

  private mapCharacters(data: any[]): Character[] {
    return data.map(d => this.mapCharacter(d))
  }
}
