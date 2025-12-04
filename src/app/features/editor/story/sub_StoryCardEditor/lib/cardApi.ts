import { StoryCard, Choice } from '@/lib/types'

/**
 * API helpers for card and choice operations
 * Centralizes all API calls for the card editor
 */

// Custom error for version conflicts
export class VersionConflictError extends Error {
  public readonly expectedVersion: number
  public readonly actualVersion: number

  constructor(message: string, expectedVersion: number, actualVersion: number) {
    super(message)
    this.name = 'VersionConflictError'
    this.expectedVersion = expectedVersion
    this.actualVersion = actualVersion
  }
}

// Card API

export interface UpdateCardPayload {
  title?: string
  content?: string
  script?: string
  imageUrl?: string | null
  imagePrompt?: string | null
  imageDescription?: string | null
  audioUrl?: string | null
  message?: string | null
  speaker?: string | null
  version?: number  // Include version for optimistic concurrency control
}

export interface UpdateCardResult {
  storyCard: StoryCard
}

export async function updateCard(
  storyStackId: string,
  cardId: string,
  updates: UpdateCardPayload
): Promise<StoryCard> {
  const response = await fetch(
    `/api/stories/${storyStackId}/cards/${cardId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  )

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}))

    // Handle version conflict (HTTP 409)
    if (response.status === 409 && errorData.code === 'STALE_VERSION') {
      throw new VersionConflictError(
        errorData.message || 'Card has been modified by another session',
        errorData.expectedVersion,
        errorData.actualVersion
      )
    }

    throw new Error(errorData.message || 'Failed to update card')
  }

  const data = await response.json()
  return data.storyCard
}

/**
 * Fetch the latest version of a card from the server
 * Used to refresh after a version conflict
 */
export async function fetchCard(
  storyStackId: string,
  cardId: string
): Promise<StoryCard> {
  const response = await fetch(
    `/api/stories/${storyStackId}/cards/${cardId}`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch card')
  }

  const data = await response.json()
  return data.storyCard
}

// Choice API

export async function fetchChoices(
  storyStackId: string,
  cardId: string
): Promise<Choice[]> {
  const response = await fetch(
    `/api/stories/${storyStackId}/cards/${cardId}/choices`
  )

  if (!response.ok) {
    throw new Error('Failed to fetch choices')
  }

  const data = await response.json()
  return data.choices || []
}

export interface CreateChoicePayload {
  label: string
  targetCardId: string
  orderIndex: number
}

export async function createChoice(
  storyStackId: string,
  cardId: string,
  payload: CreateChoicePayload
): Promise<Choice> {
  const response = await fetch(
    `/api/stories/${storyStackId}/cards/${cardId}/choices`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to create choice')
  }

  const data = await response.json()
  return data.choice
}

export interface UpdateChoicePayload {
  label?: string
  targetCardId?: string
  orderIndex?: number
}

export async function updateChoice(
  storyStackId: string,
  cardId: string,
  choiceId: string,
  updates: UpdateChoicePayload
): Promise<Choice> {
  const response = await fetch(
    `/api/stories/${storyStackId}/cards/${cardId}/choices/${choiceId}`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    }
  )

  if (!response.ok) {
    throw new Error('Failed to update choice')
  }

  const data = await response.json()
  return data.choice
}

export async function deleteChoice(
  storyStackId: string,
  cardId: string,
  choiceId: string
): Promise<void> {
  const response = await fetch(
    `/api/stories/${storyStackId}/cards/${cardId}/choices/${choiceId}`,
    {
      method: 'DELETE',
    }
  )

  if (!response.ok) {
    throw new Error('Failed to delete choice')
  }
}

// Publish API

export async function publishStory(storyId: string): Promise<{ slug: string }> {
  const response = await fetch(`/api/stories/${storyId}/publish`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to publish story')
  }

  return response.json()
}

export async function unpublishStory(storyId: string): Promise<void> {
  const response = await fetch(`/api/stories/${storyId}/unpublish`, {
    method: 'POST',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to unpublish story')
  }
}
