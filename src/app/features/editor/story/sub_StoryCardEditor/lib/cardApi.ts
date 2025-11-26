import { StoryCard, Choice } from '@/lib/types'

/**
 * API helpers for card and choice operations
 * Centralizes all API calls for the card editor
 */

// Card API

export interface UpdateCardPayload {
  title?: string
  content?: string
  script?: string
  imageUrl?: string | null
  imagePrompt?: string | null
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
    const error = await response.json().catch(() => ({}))
    throw new Error(error.message || 'Failed to update card')
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
