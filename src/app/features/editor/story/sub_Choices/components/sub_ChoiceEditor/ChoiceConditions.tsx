'use client'

/**
 * ChoiceConditions Component
 * 
 * Displays validation warnings and conditions for choices.
 * Shows alerts when cards are insufficient or targets are invalid.
 */

import { AlertCircle } from 'lucide-react'

interface ChoiceConditionsProps {
  availableCardsCount: number
}

export function ChoiceConditions({ availableCardsCount }: ChoiceConditionsProps) {
  if (availableCardsCount > 1) {
    return null
  }

  return (
    <div className="flex items-start gap-2 p-2.5 sm:p-3 bg-amber-50 border border-amber-200 rounded-lg">
      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-xs text-amber-800">
        Create more cards to add choices. Choices allow players to navigate between cards.
      </p>
    </div>
  )
}
