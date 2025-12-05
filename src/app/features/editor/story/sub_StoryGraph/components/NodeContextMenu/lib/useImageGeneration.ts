'use client'

import { useState, useCallback } from 'react'
import { StoryCard } from '@/lib/types'
import { GenerationState, GeneratedSketch } from './types'
import {
  generateSketchesFromNarrative,
  cleanupUnusedSketches,
} from '../../../../sub_ContentSection/lib/sketchGeneration'

// ============================================================================
// Image Generation Hook
// ============================================================================

export function useImageGeneration(
  card: StoryCard,
  storyStackId: string,
  artStylePrompt: string,
  onUpdate: (updates: Partial<StoryCard>) => void
) {
  const [state, setState] = useState<GenerationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [sketches, setSketches] = useState<GeneratedSketch[]>([])
  const [generationIds, setGenerationIds] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const hasImage = !!card.imageUrl
  const hasContent = !!(card.content && card.content.trim().length > 20)

  const generate = useCallback(async () => {
    if (!hasContent || state === 'loading') return

    setState('loading')
    setError(null)
    setSketches([])
    setSelectedIndex(null)

    try {
      const result = await generateSketchesFromNarrative(card.content || '', {
        artStylePrompt,
        count: 3,
      })

      setSketches(result.sketches)
      setGenerationIds(result.generationIds)
      setState('idle')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate images')
      setState('error')
    }
  }, [card.content, hasContent, state, artStylePrompt])

  const selectSketch = useCallback((index: number) => {
    setSelectedIndex(index)
  }, [])

  const applySketch = useCallback(async () => {
    if (selectedIndex === null || !sketches[selectedIndex]) return

    const sketch = sketches[selectedIndex]
    onUpdate({
      imageUrl: sketch.url,
      imagePrompt: sketch.prompt || null,
    })

    // Cleanup unused generations
    await cleanupUnusedSketches(generationIds, sketch.generationId)

    setSketches([])
    setGenerationIds([])
    setSelectedIndex(null)
    setState('success')

    setTimeout(() => setState('idle'), 2000)
  }, [selectedIndex, sketches, generationIds, onUpdate])

  const cancelSketches = useCallback(async () => {
    if (generationIds.length > 0) {
      await cleanupUnusedSketches(generationIds)
    }
    setSketches([])
    setGenerationIds([])
    setSelectedIndex(null)
  }, [generationIds])

  return {
    state,
    error,
    hasImage,
    hasContent,
    sketches,
    selectedIndex,
    generate,
    selectSketch,
    applySketch,
    cancelSketches,
  }
}
