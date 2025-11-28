// Character types - Character, archetypes, poses, and related input types

// Character - for story characters
export interface Character {
  id: string
  storyStackId: string
  name: string
  appearance: string  // Description of character's appearance
  imageUrls: string[]  // Up to 4 AI-generated character images
  imagePrompts: string[]  // Prompts used to generate the images
  avatarUrl: string | null  // Small RPG-style avatar image
  avatarPrompt: string | null  // Prompt used to generate the avatar
  orderIndex: number  // For editor organization
  createdAt: string
  updatedAt: string
}

// Character archetype options
export type CharacterArchetype = 
  | 'knight'
  | 'wizard'
  | 'assassin'
  | 'ranger'
  | 'cleric'
  | 'barbarian'
  | 'bard'
  | 'custom'

// Character pose options
export type CharacterPose = 
  | 'heroic_stance'
  | 'battle_ready'
  | 'casual_standing'
  | 'sitting'
  | 'walking'
  | 'action_pose'
  | 'mysterious'
  | 'regal'

// Input types for creating/updating characters
export interface CreateCharacterInput {
  storyStackId: string
  name: string
  appearance?: string
  imageUrls?: string[]
  imagePrompts?: string[]
  avatarUrl?: string | null
  avatarPrompt?: string | null
  orderIndex?: number
}

export interface UpdateCharacterInput {
  name?: string
  appearance?: string
  imageUrls?: string[]
  imagePrompts?: string[]
  avatarUrl?: string | null
  avatarPrompt?: string | null
  orderIndex?: number
}
