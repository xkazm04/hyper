'use client'

import { cn } from '@/lib/utils'
import { Loader2, Check, AlertCircle } from 'lucide-react'
import { GenerationState } from './lib/types'

// ============================================================================
// Action Icon Button - Compact icon button for quick actions
// ============================================================================

interface ActionIconButtonProps {
  icon: React.ComponentType<{ className?: string }>
  label: string
  done: boolean
  state: GenerationState
  isHalloween?: boolean
  disabled?: boolean
  onClick: () => void
}

export function ActionIconButton({
  icon: Icon,
  label,
  done,
  state,
  isHalloween,
  disabled,
  onClick,
}: ActionIconButtonProps) {
  const isLoading = state === 'loading'
  const isSuccess = state === 'success'
  const isError = state === 'error'

  // If content exists, button is green and disabled (no action needed)
  const isComplete = done && state === 'idle'

  return (
    <button
      onClick={onClick}
      disabled={disabled || isLoading || isComplete}
      title={
        isComplete
          ? `${label} - Complete`
          : isLoading
          ? `Generating ${label}...`
          : disabled
          ? `Add content first`
          : `Generate ${label}`
      }
      className={cn(
        'relative flex flex-col items-center justify-center gap-1 p-3 rounded-xl transition-all',
        'border-2 min-w-[72px]',
        // Complete state - green, disabled
        isComplete &&
          (isHalloween
            ? 'bg-orange-500/20 border-orange-500/50 text-orange-400 cursor-default'
            : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-500 cursor-default'),
        // Loading state
        isLoading && 'opacity-70 cursor-wait bg-muted/50 border-border',
        // Success flash
        isSuccess && 'bg-emerald-500/30 border-emerald-500 text-emerald-500',
        // Error state
        isError && 'bg-destructive/20 border-destructive/50 text-destructive',
        // Idle, actionable state
        !isComplete &&
          !isLoading &&
          !isSuccess &&
          !isError &&
          !disabled &&
          (isHalloween
            ? 'bg-purple-900/50 border-purple-500/30 text-purple-300 hover:bg-purple-800/50 hover:border-purple-400/50'
            : 'bg-muted/50 border-border text-muted-foreground hover:bg-primary/10 hover:border-primary/50 hover:text-primary'),
        // Disabled state
        disabled &&
          !isComplete &&
          'bg-muted/30 border-border/50 text-muted-foreground/40 cursor-not-allowed'
      )}
    >
      {/* Icon */}
      <div className="w-6 h-6 flex items-center justify-center">
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isSuccess ? (
          <Check className="w-5 h-5" />
        ) : isError ? (
          <AlertCircle className="w-5 h-5" />
        ) : (
          <Icon className="w-5 h-5" />
        )}
      </div>

      {/* Label */}
      <span className="text-[10px] font-medium uppercase tracking-wide">
        {label}
      </span>

      {/* Completion badge */}
      {isComplete && (
        <div
          className={cn(
            'absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center',
            isHalloween ? 'bg-orange-500' : 'bg-emerald-500'
          )}
        >
          <Check className="w-2.5 h-2.5 text-white" />
        </div>
      )}
    </button>
  )
}
