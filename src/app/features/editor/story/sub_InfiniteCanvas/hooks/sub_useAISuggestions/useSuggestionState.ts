'use client'

import { useState, useRef, useEffect } from 'react'
import { aiPredictionService } from '@/lib/services/prediction/index'
import { SuggestedCard, UserAIPreferences } from '@/lib/types/ai-canvas'

interface UseSuggestionStateReturn {
  suggestions: SuggestedCard[]
  setSuggestions: React.Dispatch<React.SetStateAction<SuggestedCard[]>>
  isGenerating: boolean
  setIsGenerating: React.Dispatch<React.SetStateAction<boolean>>
  error: string | null
  setError: React.Dispatch<React.SetStateAction<string | null>>
  hoveredSuggestionId: string | null
  setHoveredSuggestionId: React.Dispatch<React.SetStateAction<string | null>>
  userPreferences: UserAIPreferences | null
  pendingSuggestionIds: React.MutableRefObject<Set<string>>
  debounceTimerRef: React.MutableRefObject<NodeJS.Timeout | null>
}

/**
 * Hook for managing AI suggestion state
 * 
 * Features:
 * - Suggestions list state
 * - Loading and error states
 * - Hover state for suggestions
 * - User preferences loading
 * - Refs for pending suggestions and debounce timer
 */
export function useSuggestionState(
  userId: string | null,
  enabled: boolean
): UseSuggestionStateReturn {
  const [suggestions, setSuggestions] = useState<SuggestedCard[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredSuggestionId, setHoveredSuggestionId] = useState<string | null>(null)
  const [userPreferences, setUserPreferences] = useState<UserAIPreferences | null>(null)

  // Track pending suggestion records for cleanup
  const pendingSuggestionIds = useRef<Set<string>>(new Set())
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load user preferences on mount
  useEffect(() => {
    if (userId && enabled) {
      aiPredictionService.getUserPreferences(userId).then(prefs => {
        if (prefs) setUserPreferences(prefs)
      })
    }
  }, [userId, enabled])

  return {
    suggestions,
    setSuggestions,
    isGenerating,
    setIsGenerating,
    error,
    setError,
    hoveredSuggestionId,
    setHoveredSuggestionId,
    userPreferences,
    pendingSuggestionIds,
    debounceTimerRef,
  }
}
