import { NextRequest } from 'next/server'
import { SupabaseClient } from '@supabase/supabase-js'
import { StoryService } from '@/lib/services/story/index'
import {
  authenticateRequest,
  handleApiError,
  errorResponse,
  successResponse,
} from '@/lib/api/auth'
import type { Database, ReorderCardsResult } from '@/lib/supabase/database.types'

interface CardOrder {
  id: string
  orderIndex: number
}

interface ReorderRequestBody {
  cardOrders: CardOrder[]
  idempotencyKey?: string
}

/**
 * PATCH /api/stories/[id]/cards/reorder
 * Reorder cards for a story stack (batch update order indices)
 *
 * Uses atomic database transaction with idempotency key support
 * to prevent race conditions and duplicate submissions.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const auth = await authenticateRequest()
    if (!auth.success) return auth.response

    const { user, supabase } = auth
    const storyService = new StoryService(supabase)
    const storyStack = await storyService.getStoryStack(id)

    if (!storyStack) {
      return errorResponse('Story stack not found', 404)
    }

    if (storyStack.ownerId !== user.id) {
      return errorResponse('Unauthorized to modify this story stack', 403)
    }

    const body: ReorderRequestBody = await request.json()
    const { cardOrders, idempotencyKey } = body

    if (!cardOrders || !Array.isArray(cardOrders)) {
      return errorResponse('Invalid request body: cardOrders array required', 400)
    }

    if (cardOrders.length === 0) {
      return successResponse({ message: 'No cards to reorder', updatedCount: 0 })
    }

    // Validate cardOrders structure
    for (const order of cardOrders) {
      if (!order.id || typeof order.orderIndex !== 'number') {
        return errorResponse('Invalid cardOrders: each item must have id and orderIndex', 400)
      }
    }

    // Try atomic RPC first (preferred method)
    const rpcResult = await tryAtomicReorder(supabase, id, cardOrders, idempotencyKey)

    if (rpcResult.success) {
      return successResponse({
        message: rpcResult.idempotent
          ? 'Operation already completed (idempotent)'
          : 'Cards reordered successfully',
        updatedCount: rpcResult.updatedCount,
        idempotent: rpcResult.idempotent,
      })
    }

    // Fallback to Promise.allSettled if RPC fails (e.g., function not deployed yet)
    console.warn('Atomic reorder RPC failed, falling back to Promise.allSettled:', rpcResult.error)

    const fallbackResult = await fallbackReorder(storyService, cardOrders)

    if (fallbackResult.allSucceeded) {
      return successResponse({
        message: 'Cards reordered successfully',
        updatedCount: fallbackResult.successCount,
        fallback: true,
      })
    }

    // Partial failure in fallback - return error with details
    return errorResponse(
      `Partial reorder failure: ${fallbackResult.successCount}/${cardOrders.length} cards updated. ` +
        `Failed cards: ${fallbackResult.failedCardIds.join(', ')}. ` +
        'Some card positions may be inconsistent.',
      500
    )
  } catch (error) {
    return handleApiError(error, {
      logPrefix: 'Error reordering story cards',
      fallbackMessage: 'Failed to reorder story cards',
    })
  }
}

/**
 * Attempts atomic reorder using the database RPC function.
 * This ensures all updates happen in a single transaction.
 */
async function tryAtomicReorder(
  supabase: SupabaseClient<Database>,
  storyStackId: string,
  cardOrders: CardOrder[],
  idempotencyKey?: string
): Promise<{
  success: boolean
  updatedCount: number
  idempotent: boolean
  error?: string
}> {
  try {
    // Type assertion needed as the RPC may not be deployed yet
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any).rpc('reorder_story_cards', {
      p_story_stack_id: storyStackId,
      p_card_orders: cardOrders,
      p_idempotency_key: idempotencyKey ?? null,
    })

    if (error) {
      return {
        success: false,
        updatedCount: 0,
        idempotent: false,
        error: error.message,
      }
    }

    const result = data as ReorderCardsResult

    if (!result.success) {
      return {
        success: false,
        updatedCount: 0,
        idempotent: false,
        error: result.message,
      }
    }

    return {
      success: true,
      updatedCount: result.updated_count,
      idempotent: result.idempotent,
    }
  } catch (err) {
    return {
      success: false,
      updatedCount: 0,
      idempotent: false,
      error: err instanceof Error ? err.message : 'Unknown RPC error',
    }
  }
}

/**
 * Fallback reorder using Promise.allSettled.
 * Used when the RPC function is not available.
 * Reports partial failures instead of silently corrupting data.
 */
async function fallbackReorder(
  storyService: StoryService,
  cardOrders: CardOrder[]
): Promise<{
  allSucceeded: boolean
  successCount: number
  failedCardIds: string[]
}> {
  const updatePromises = cardOrders.map(async ({ id: cardId, orderIndex }) => {
    try {
      await storyService.updateStoryCard(cardId, { orderIndex })
      return { cardId, success: true as const }
    } catch (error) {
      console.error(`Failed to update card ${cardId}:`, error)
      return {
        cardId,
        success: false as const,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  })

  const results = await Promise.allSettled(updatePromises)

  const successCount = results.filter(
    (r) => r.status === 'fulfilled' && r.value.success
  ).length

  const failedCardIds = results
    .map((r) => {
      if (r.status === 'rejected') return 'unknown'
      if (!r.value.success) return r.value.cardId
      return null
    })
    .filter((id): id is string => id !== null)

  return {
    allSucceeded: failedCardIds.length === 0,
    successCount,
    failedCardIds,
  }
}
