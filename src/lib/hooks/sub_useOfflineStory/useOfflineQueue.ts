'use client'

import { syncService } from '@/lib/services/sync/index'
import {
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from '@/lib/types'

/**
 * Queue operations for offline sync
 * Queues mutations when offline for later synchronization
 */
export function useOfflineQueue() {
  // Story Stack Queue Operations
  const queueStackCreate = async (input: CreateStoryStackInput, tempId: string) => {
    await syncService.queueStoryStackCreate(input, tempId)
  }

  const queueStackUpdate = async (id: string, input: UpdateStoryStackInput) => {
    await syncService.queueStoryStackUpdate(id, input)
  }

  const queueStackDelete = async (id: string) => {
    await syncService.queueStoryStackDelete(id)
  }

  // Story Card Queue Operations
  const queueCardCreate = async (input: CreateStoryCardInput, tempId: string) => {
    await syncService.queueStoryCardCreate(input, tempId)
  }

  const queueCardUpdate = async (id: string, input: UpdateStoryCardInput) => {
    await syncService.queueStoryCardUpdate(id, input)
  }

  const queueCardDelete = async (id: string) => {
    await syncService.queueStoryCardDelete(id)
  }

  // Choice Queue Operations
  const queueChoiceCreate = async (input: CreateChoiceInput, tempId: string) => {
    await syncService.queueChoiceCreate(input, tempId)
  }

  const queueChoiceUpdate = async (id: string, input: UpdateChoiceInput) => {
    await syncService.queueChoiceUpdate(id, input)
  }

  const queueChoiceDelete = async (id: string) => {
    await syncService.queueChoiceDelete(id)
  }

  return {
    // Stack queue
    queueStackCreate,
    queueStackUpdate,
    queueStackDelete,
    // Card queue
    queueCardCreate,
    queueCardUpdate,
    queueCardDelete,
    // Choice queue
    queueChoiceCreate,
    queueChoiceUpdate,
    queueChoiceDelete,
  }
}

export type OfflineQueue = ReturnType<typeof useOfflineQueue>
