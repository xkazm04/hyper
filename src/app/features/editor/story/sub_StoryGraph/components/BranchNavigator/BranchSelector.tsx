'use client'

import { memo } from 'react'
import { cn } from '@/lib/utils'
import { BranchInfo } from '../../hooks/useBranchPath'
import { ChevronRight, ArrowRight } from 'lucide-react'

export interface BranchSelectorProps {
  /** Available branches to select from */
  branches: BranchInfo[]
  /** Currently selected branch index */
  selectedIndex: number
  /** Callback when a branch is selected */
  onSelectBranch: (index: number) => void
  /** Halloween theme flag */
  isHalloween: boolean
}

// Branch colors for visual distinction (matches edge colors in graph)
const BRANCH_COLORS = [
  { bg: 'bg-blue-500/20', border: 'border-blue-500', text: 'text-blue-400', halloweenText: 'text-blue-300' },
  { bg: 'bg-teal-500/20', border: 'border-teal-500', text: 'text-teal-400', halloweenText: 'text-teal-300' },
  { bg: 'bg-purple-500/20', border: 'border-purple-500', text: 'text-purple-400', halloweenText: 'text-purple-300' },
]

/**
 * BranchSelector - Component to select which branch/choice to follow
 *
 * Displays available branches as selectable buttons with:
 * - Color-coded indicators matching graph edges
 * - Choice label text
 * - Target card title (if available)
 */
export const BranchSelector = memo(function BranchSelector({
  branches,
  selectedIndex,
  onSelectBranch,
  isHalloween
}: BranchSelectorProps) {
  if (branches.length === 0) {
    return (
      <div className={cn(
        'text-xs text-center py-2 rounded-lg',
        isHalloween ? 'text-purple-200/50 bg-purple-900/20' : 'text-muted-foreground bg-muted/30'
      )}>
        No outgoing branches (dead end)
      </div>
    )
  }

  return (
    <div className="space-y-1.5" data-testid="branch-selector">
      <p className={cn(
        'text-[10px] uppercase tracking-wider font-semibold',
        isHalloween ? 'text-purple-200/50' : 'text-muted-foreground'
      )}>
        Select Branch
      </p>
      <div className="space-y-1">
        {branches.map((branch, index) => {
          const colors = BRANCH_COLORS[index % BRANCH_COLORS.length]
          const isSelected = index === selectedIndex
          const targetTitle = branch.targetCard?.title || 'Untitled'

          return (
            <button
              key={branch.choice.id}
              onClick={() => onSelectBranch(index)}
              className={cn(
                'w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left transition-all',
                'border-2',
                isSelected
                  ? cn(
                      colors.bg,
                      colors.border,
                      'shadow-sm'
                    )
                  : cn(
                      'border-transparent',
                      isHalloween
                        ? 'hover:bg-purple-900/30 hover:border-orange-500/20'
                        : 'hover:bg-muted/50 hover:border-border'
                    )
              )}
              data-testid={`branch-option-${index}`}
              aria-pressed={isSelected}
            >
              {/* Branch indicator */}
              <div className={cn(
                'w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0',
                'text-[10px] font-bold',
                isSelected ? colors.bg : isHalloween ? 'bg-purple-900/40' : 'bg-muted',
                isSelected ? colors.text : isHalloween ? 'text-purple-200/60' : 'text-muted-foreground'
              )}>
                {index + 1}
              </div>

              {/* Choice label and target */}
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-xs font-medium truncate',
                  isSelected
                    ? isHalloween ? colors.halloweenText : colors.text
                    : isHalloween ? 'text-orange-100' : 'text-foreground'
                )}>
                  {branch.choice.label || 'Unnamed choice'}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <ArrowRight className={cn(
                    'w-2.5 h-2.5 flex-shrink-0',
                    isHalloween ? 'text-purple-200/40' : 'text-muted-foreground/50'
                  )} />
                  <span className={cn(
                    'text-[10px] truncate',
                    isHalloween ? 'text-purple-200/60' : 'text-muted-foreground'
                  )}>
                    {targetTitle}
                  </span>
                </div>
              </div>

              {/* Selected indicator */}
              {isSelected && (
                <ChevronRight className={cn(
                  'w-4 h-4 flex-shrink-0',
                  isHalloween ? colors.halloweenText : colors.text
                )} />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
})

BranchSelector.displayName = 'BranchSelector'
