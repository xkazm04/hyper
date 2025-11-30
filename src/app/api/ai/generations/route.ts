import { NextRequest, NextResponse } from 'next/server'

interface DeleteResult {
  id: string
  error: string
}

/**
 * DELETE /api/ai/generations
 * Delete multiple Leonardo generations by ID (batch delete)
 * 
 * Request body:
 * {
 *   generationIds: string[]
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   deleted: string[]
 *   failed: { id: string, error: string }[]
 * }
 * 
 * Requirements: FR-1.2
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { generationIds } = body

    // Validate input
    if (!generationIds || !Array.isArray(generationIds)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'generationIds array is required',
          deleted: [],
          failed: [],
        },
        { status: 400 }
      )
    }

    // Filter out invalid IDs
    const validIds = generationIds.filter(
      (id): id is string => typeof id === 'string' && id.trim().length > 0
    )

    if (validIds.length === 0) {
      return NextResponse.json({
        success: true,
        deleted: [],
        failed: [],
        message: 'No valid generation IDs provided',
      })
    }

    // Get Leonardo API key from environment
    const leonardoApiKey = process.env.LEONARDO_API_KEY
    if (!leonardoApiKey) {
      console.error('LEONARDO_API_KEY is not configured')
      return NextResponse.json(
        { 
          success: false, 
          error: 'Leonardo API is not configured',
          deleted: [],
          failed: validIds.map(id => ({ id, error: 'API not configured' })),
        },
        { status: 503 }
      )
    }

    const deleted: string[] = []
    const failed: DeleteResult[] = []

    // Delete each generation
    // Using Promise.allSettled to handle partial failures gracefully
    const deletePromises = validIds.map(async (generationId) => {
      try {
        const response = await fetch(
          `https://cloud.leonardo.ai/api/rest/v1/generations/${generationId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${leonardoApiKey}`,
              'Content-Type': 'application/json',
            },
          }
        )

        if (response.ok || response.status === 404) {
          // 404 means already deleted, treat as success for idempotency
          return { id: generationId, success: true }
        }

        const errorData = await response.json().catch(() => ({}))
        return { 
          id: generationId, 
          success: false, 
          error: errorData.error || `HTTP ${response.status}`,
        }
      } catch (error) {
        return { 
          id: generationId, 
          success: false, 
          error: error instanceof Error ? error.message : 'Unknown error',
        }
      }
    })

    const results = await Promise.allSettled(deletePromises)

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { id, success, error } = result.value
        if (success) {
          deleted.push(id)
        } else {
          failed.push({ id, error: error || 'Unknown error' })
        }
      } else {
        // Promise rejected (shouldn't happen with our try/catch, but handle it)
        console.error('Unexpected promise rejection:', result.reason)
      }
    })

    // Log failures for monitoring
    if (failed.length > 0) {
      console.error('Batch delete partial failures:', {
        timestamp: new Date().toISOString(),
        failed,
      })
    }

    return NextResponse.json({
      success: failed.length === 0,
      deleted,
      failed,
    })

  } catch (error) {
    console.error('Error in batch delete:', error)

    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to process batch delete',
        deleted: [],
        failed: [],
      },
      { status: 500 }
    )
  }
}
