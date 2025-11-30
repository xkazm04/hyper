'use client'

import { memo } from 'react'
import { Sparkles, ZapOff, Zap } from 'lucide-react'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'

/**
 * PerformanceToggle - Toggle switch for heavy animations
 *
 * Allows users to manually enable/disable decorative animations
 * for better performance on low-end devices.
 */
export const PerformanceToggle = memo(function PerformanceToggle() {
  const { toggleLowPower, showHeavyAnimations } = usePerformanceOptional()

  return (
    <div className="bg-card/95 border-2 border-border rounded-lg p-3 shadow-lg backdrop-blur-sm w-full">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">Effects</span>
        </div>

        <button
          onClick={toggleLowPower}
          className={`
            flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-all
            ${showHeavyAnimations
              ? 'bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20'
              : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
            }
          `}
          data-testid="performance-toggle-btn"
          aria-pressed={showHeavyAnimations}
          aria-label={showHeavyAnimations ? 'Disable heavy animations' : 'Enable heavy animations'}
        >
          {showHeavyAnimations ? (
            <>
              <Zap className="w-3.5 h-3.5" />
              <span>On</span>
            </>
          ) : (
            <>
              <ZapOff className="w-3.5 h-3.5" />
              <span>Off</span>
            </>
          )}
        </button>
      </div>

      <p className="text-xs text-muted-foreground mt-1.5">
        {showHeavyAnimations
          ? 'Decorative effects are enabled'
          : 'Low-power mode: Effects disabled'
        }
      </p>
    </div>
  )
})

export default PerformanceToggle
