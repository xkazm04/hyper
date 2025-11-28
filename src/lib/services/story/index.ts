// Barrel file for story service modules
// Preserves backward compatibility with original story.ts exports

import { SupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { StoryCrudService } from './crud'
import { CardsService } from './cards'
import { CharactersService } from './characters'
import { PublishingService } from './publishing'
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
} from './types'

// Re-export sub-services for direct access
export { StoryCrudService } from './crud'
export { CardsService } from './cards'
export { CharactersService } from './characters'
export { PublishingService } from './publishing'

// Re-export types
export * from './types'

/**
 * StoryService - Unified facade for all story operations
 * Maintains backward compatibility with original story.ts API
 */
export class StoryService {
  private crudService: StoryCrudService
  private cardsService: CardsService
  private charactersService: CharactersService
  private publishingService: PublishingService

  constructor(supabaseClient?: SupabaseClient) {
    const client = supabaseClient || createClient()
    this.crudService = new StoryCrudService(client)
    this.cardsService = new CardsService(client)
    this.charactersService = new CharactersService(client)
    this.publishingService = new PublishingService(client)
  }

  // ============================================================================
  // Story Stack Operations
  // ============================================================================

  async getStoryStacks(userId?: string): Promise<StoryStack[]> {
    return this.crudService.getStoryStacks(userId)
  }

  async getStoryStack(id: string): Promise<StoryStack | null> {
    return this.crudService.getStoryStack(id)
  }

  async getPublishedStoryStack(slug: string): Promise<StoryStack | null> {
    return this.crudService.getPublishedStoryStack(slug)
  }

  async createStoryStack(input: CreateStoryStackInput): Promise<StoryStack> {
    return this.crudService.createStoryStack(input)
  }

  async updateStoryStack(id: string, input: UpdateStoryStackInput): Promise<StoryStack> {
    return this.crudService.updateStoryStack(id, input)
  }

  async deleteStoryStack(id: string): Promise<void> {
    return this.crudService.deleteStoryStack(id)
  }

  async publishStoryStack(id: string): Promise<StoryStack> {
    return this.publishingService.publishStoryStack(id)
  }

  async unpublishStoryStack(id: string): Promise<StoryStack> {
    return this.publishingService.unpublishStoryStack(id)
  }

  // ============================================================================
  // Story Card Operations
  // ============================================================================

  async getStoryCards(storyStackId: string): Promise<StoryCard[]> {
    return this.cardsService.getStoryCards(storyStackId)
  }

  async getStoryCard(id: string): Promise<StoryCard | null> {
    return this.cardsService.getStoryCard(id)
  }

  async createStoryCard(input: CreateStoryCardInput): Promise<StoryCard> {
    return this.cardsService.createStoryCard(input)
  }

  async updateStoryCard(id: string, input: UpdateStoryCardInput): Promise<StoryCard> {
    return this.cardsService.updateStoryCard(id, input)
  }

  async deleteStoryCard(id: string): Promise<void> {
    return this.cardsService.deleteStoryCard(id)
  }

  // ============================================================================
  // Choice Operations
  // ============================================================================

  async getChoices(storyCardId: string): Promise<Choice[]> {
    return this.cardsService.getChoices(storyCardId)
  }

  async createChoice(input: CreateChoiceInput): Promise<Choice> {
    return this.cardsService.createChoice(input)
  }

  async updateChoice(id: string, input: UpdateChoiceInput): Promise<Choice> {
    return this.cardsService.updateChoice(id, input)
  }

  async deleteChoice(id: string): Promise<void> {
    return this.cardsService.deleteChoice(id)
  }

  // ============================================================================
  // Character Operations
  // ============================================================================

  async getCharacters(storyStackId: string): Promise<Character[]> {
    return this.charactersService.getCharacters(storyStackId)
  }

  async getCharacter(id: string): Promise<Character | null> {
    return this.charactersService.getCharacter(id)
  }

  async createCharacter(input: CreateCharacterInput): Promise<Character> {
    return this.charactersService.createCharacter(input)
  }

  async updateCharacter(id: string, input: UpdateCharacterInput): Promise<Character> {
    return this.charactersService.updateCharacter(id, input)
  }

  async deleteCharacter(id: string): Promise<void> {
    return this.charactersService.deleteCharacter(id)
  }

  // ============================================================================
  // Utility Operations
  // ============================================================================

  async generateSlug(name: string): Promise<string> {
    return this.publishingService.generateSlug(name)
  }

  async validateStoryGraph(storyStackId: string): Promise<ValidationResult> {
    return this.publishingService.validateStoryGraph(storyStackId)
  }
}
