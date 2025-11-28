'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface SuggestionActionsProps {
  id: string
  onAccept: (e: React.MouseEvent) => void
  onDecline: (e: React.MouseEvent) => void
}

/**
 * SuggestionActions - Accept/decline buttons for AI suggestions
 * 
 * Features:
 * - Accept button with emerald styling
 * - Decline button with red styling
 * - Focus ring for accessibility
 */
export function SuggestionActions({
  id,
  onAccept,
  onDecline,
}: SuggestionActionsProps) {
  return (
    <div className="flex border-t border-border/30">
      <button
        onClick={onAccept}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium',
          'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20',
          'transition-colors rounded-bl-lg border-r border-border/30',
          'focus:outline-none focus:ring-2 focus:ring-emerald-500/30'
        )}
        data-testid={`accept-suggestion-btn-${id}`}
      >
        <Check className="w-3.5 h-3.5" />
        Accept
      </button>
      <button
        onClick={onDecline}
        className={cn(
          'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium',
          'bg-red-500/10 text-red-500 hover:bg-red-500/20',
          'transition-colors rounded-br-lg',
          'focus:outline-none focus:ring-2 focus:ring-red-500/30'
        )}
        data-testid={`decline-suggestion-btn-${id}`}
      >
        <X className="w-3.5 h-3.5" />
        Decline
      </button>
    </div>
  )
}
