// Character types - Character, archetypes, poses, and related input types

// Bria model training status
export type BriaModelStatus = 'none' | 'pending' | 'training' | 'completed' | 'failed'

// Character - for story characters
export interface Character {
  id: string
  storyStackId: string
  name: string
  appearance: string  // Description of character's appearance
  imageUrls: string[]  // Up to 10 AI-generated character images for training
  imagePrompts: string[]  // Prompts used to generate the images
  avatarUrl: string | null  // Small RPG-style avatar image
  avatarPrompt: string | null  // Prompt used to generate the avatar
  orderIndex: number  // For editor organization
  createdAt: string
  updatedAt: string

  // Bria AI training fields
  briaProjectId: string | null
  briaDatasetId: string | null
  briaModelId: string | null
  briaModelStatus: BriaModelStatus
  briaCaptionPrefix: string | null
  briaTrainingStartedAt: string | null
  briaTrainingCompletedAt: string | null
  briaErrorMessage: string | null
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
  // Bria training fields
  briaProjectId?: string | null
  briaDatasetId?: string | null
  briaModelId?: string | null
  briaModelStatus?: BriaModelStatus
  briaCaptionPrefix?: string | null
  briaTrainingStartedAt?: string | null
  briaTrainingCompletedAt?: string | null
  briaErrorMessage?: string | null
}
