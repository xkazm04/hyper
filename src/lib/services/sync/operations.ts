import { StoryService } from '../story'
import type {
  CreateStoryStackInput,
  UpdateStoryStackInput,
  CreateStoryCardInput,
  UpdateStoryCardInput,
  CreateChoiceInput,
  UpdateChoiceInput,
} from '@/lib/types'
import {
  saveStoryStack,
  saveStoryCards,
  saveChoices,
  deleteStoryStackFromDB,
  deleteStoryCardsForStack,
  deleteStoryCardFromDB,
  deleteChoicesForCard,
  deleteChoiceFromDB,
  SyncQueueItem,
  SyncOperation,
} from '../indexeddb'
import type { SyncData } from './types'

export class OperationsService {
  private storyService: StoryService

  constructor(storyService?: StoryService) {
    this.storyService = storyService || new StoryService()
  }

  async processSyncItem(item: SyncQueueItem): Promise<void> {
    const { entityType, entityId, operation, data } = item

    switch (entityType) {
      case 'storyStack':
        await this.processStoryStackSync(entityId, operation, data)
        break
      case 'storyCard':
        await this.processStoryCardSync(entityId, operation, data)
        break
      case 'choice':
        await this.processChoiceSync(entityId, operation, data)
        break
    }
  }

  private async processStoryStackSync(
    id: string,
    operation: SyncOperation,
    data?: SyncData
  ): Promise<void> {
    switch (operation) {
      case 'create':
        const newStack = await this.storyService.createStoryStack(data as CreateStoryStackInput)
        await saveStoryStack(newStack)
        await deleteStoryStackFromDB(id)
        break
      case 'update':
        const updatedStack = await this.storyService.updateStoryStack(id, data as UpdateStoryStackInput)
        await saveStoryStack(updatedStack)
        break
      case 'delete':
        await this.storyService.deleteStoryStack(id)
        await deleteStoryStackFromDB(id)
        await deleteStoryCardsForStack(id)
        break
    }
  }

  private async processStoryCardSync(
    id: string,
    operation: SyncOperation,
    data?: SyncData
  ): Promise<void> {
    switch (operation) {
      case 'create':
        const newCard = await this.storyService.createStoryCard(data as CreateStoryCardInput)
        await saveStoryCards([newCard])
        await deleteStoryCardFromDB(id)
        break
      case 'update':
        const updatedCard = await this.storyService.updateStoryCard(id, data as UpdateStoryCardInput)
        await saveStoryCards([updatedCard])
        break
      case 'delete':
        await this.storyService.deleteStoryCard(id)
        await deleteStoryCardFromDB(id)
        await deleteChoicesForCard(id)
        break
    }
  }

  private async processChoiceSync(
    id: string,
    operation: SyncOperation,
    data?: SyncData
  ): Promise<void> {
    switch (operation) {
      case 'create':
        const newChoice = await this.storyService.createChoice(data as CreateChoiceInput)
        await saveChoices([newChoice])
        await deleteChoiceFromDB(id)
        break
      case 'update':
        const updatedChoice = await this.storyService.updateChoice(id, data as UpdateChoiceInput)
        await saveChoices([updatedChoice])
        break
      case 'delete':
        await this.storyService.deleteChoice(id)
        await deleteChoiceFromDB(id)
        break
    }
  }
}
