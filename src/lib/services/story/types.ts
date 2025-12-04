// Shared types and utilities for story service modules
import type {
  StoryStack,
  StoryCard,
  Choice,
  Character,
  CharacterCard,
  PreviewTheme,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateCharacterCardInput,
  UpdateCharacterCardInput,
  ValidationResult,
  ValidationError,
  ValidationWarning,
} from '@/lib/types'

import {
  StoryNotFoundError,
  CardNotFoundError,
  ChoiceNotFoundError,
  CharacterNotFoundError,
  CharacterCardNotFoundError,
  DatabaseError,
  StaleVersionError,
} from '@/lib/types'

// Re-export types for convenience
export type {
  StoryStack,
  StoryCard,
  Choice,
  Character,
  CharacterCard,
  PreviewTheme,
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
  CreateCharacterInput,
  UpdateCharacterInput,
  CreateCharacterCardInput,
  UpdateCharacterCardInput,
  ValidationResult,
  ValidationError,
  ValidationWarning,
}

export {
  StoryNotFoundError,
  CardNotFoundError,
  ChoiceNotFoundError,
  CharacterNotFoundError,
  CharacterCardNotFoundError,
  DatabaseError,
  StaleVersionError,
}

// Mapping utilities
export function mapStoryStack(data: any): StoryStack {
  return {
    id: data.id,
    ownerId: data.owner_id,
    name: data.name,
    description: data.description,
    isPublished: data.is_published,
    publishedAt: data.published_at,
    slug: data.slug,
    firstCardId: data.first_card_id,
    artStyleId: data.art_style_id || null,
    customArtStylePrompt: data.custom_art_style_prompt || null,
    artStyleSource: data.art_style_source || 'preset',
    extractedStyleImageUrl: data.extracted_style_image_url || null,
    coverImageUrl: data.cover_image_url || null,
    previewTheme: data.preview_theme || null,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function mapStoryStacks(data: any[]): StoryStack[] {
  return data.map(d => mapStoryStack(d))
}

export function mapStoryCard(data: any): StoryCard {
  return {
    id: data.id,
    storyStackId: data.story_stack_id,
    title: data.title,
    content: data.content,
    script: data.script || '',
    imageUrl: data.image_url,
    imagePrompt: data.image_prompt,
    imageDescription: data.image_description || null,
    audioUrl: data.audio_url || null,
    message: data.message || null,
    speaker: data.speaker || null,
    speakerType: data.speaker_type || null,
    orderIndex: data.order_index,
    version: data.version ?? 1,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function mapStoryCards(data: any[]): StoryCard[] {
  return data.map(d => mapStoryCard(d))
}

export function mapChoice(data: any): Choice {
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

export function mapChoices(data: any[]): Choice[] {
  return data.map(d => mapChoice(d))
}

export function mapCharacter(data: any): Character {
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
    // Bria training fields
    briaProjectId: data.bria_project_id || null,
    briaDatasetId: data.bria_dataset_id || null,
    briaModelId: data.bria_model_id || null,
    briaModelStatus: data.bria_model_status || 'none',
    briaCaptionPrefix: data.bria_caption_prefix || null,
    briaTrainingStartedAt: data.bria_training_started_at || null,
    briaTrainingCompletedAt: data.bria_training_completed_at || null,
    briaErrorMessage: data.bria_error_message || null,
  }
}

export function mapCharacters(data: any[]): Character[] {
  return data.map(d => mapCharacter(d))
}

export function mapCharacterCard(data: any): CharacterCard {
  return {
    id: data.id,
    storyStackId: data.story_stack_id,
    characterId: data.character_id,
    title: data.title,
    content: data.content,
    imageIndex: data.image_index,
    showAvatar: data.show_avatar,
    orderIndex: data.order_index,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

export function mapCharacterCards(data: any[]): CharacterCard[] {
  return data.map(d => mapCharacterCard(d))
}
