'use client'

import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { SimulationConfig, SimulationState } from '../lib/types'

interface SimulationControlsProps {
  state: SimulationState
  config: SimulationConfig
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onReset: () => void
  onConfigChange: (config: Partial<SimulationConfig>) => void
  showSettings: boolean
  onToggleSettings: () => void
  disabled?: boolean
}

export function SimulationControls({
  state,
  config,
  onStart,
  onPause,
  onResume,
  onReset,
  onConfigChange,
  showSettings,
  onToggleSettings,
  disabled = false,
}: SimulationControlsProps) {
  const { isRunning, isPaused, progress, currentPath, totalPaths } = state

  return (
    <div className="space-y-3">
      {/* Control buttons */}
      <div className="flex items-center gap-2">
        {!isRunning && !isPaused ? (
          <Button
            onClick={onStart}
            disabled={disabled}
            size="sm"
            className="gap-1.5"
            data-testid="simulation-start-btn"
          >
            <Play className="w-3.5 h-3.5" />
            Run Simulation
          </Button>
        ) : isRunning ? (
          <Button
            onClick={onPause}
            size="sm"
            variant="secondary"
            className="gap-1.5"
            data-testid="simulation-pause-btn"
          >
            <Pause className="w-3.5 h-3.5" />
            Pause
          </Button>
        ) : (
          <Button
            onClick={onResume}
            size="sm"
            className="gap-1.5"
            data-testid="simulation-resume-btn"
          >
            <Play className="w-3.5 h-3.5" />
            Resume
          </Button>
        )}

        <Button
          onClick={onReset}
          size="sm"
          variant="ghost"
          disabled={!state.analytics && !isRunning}
          className="gap-1.5"
          data-testid="simulation-reset-btn"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset
        </Button>

        <Button
          onClick={onToggleSettings}
          size="sm"
          variant="ghost"
          className={cn('gap-1.5', showSettings && 'bg-muted')}
          data-testid="simulation-settings-btn"
        >
          <Settings2 className="w-3.5 h-3.5" />
        </Button>
      </div>

      {/* Progress bar */}
      {(isRunning || isPaused || progress > 0) && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>
              {isRunning
                ? `Simulating path ${currentPath} of ${totalPaths}...`
                : isPaused
                ? 'Paused'
                : 'Complete'}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                'h-full transition-all duration-300',
                isRunning
                  ? 'bg-primary animate-pulse'
                  : isPaused
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              )}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Settings panel */}
      {showSettings && (
        <div className="p-3 bg-muted/50 rounded-lg border border-border space-y-3">
          <div className="text-xs font-medium text-foreground">Simulation Settings</div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label
                htmlFor="pathCount"
                className="text-xs text-muted-foreground"
              >
                Paths to simulate
              </label>
              <input
                id="pathCount"
                type="number"
                min={10}
                max={1000}
                step={10}
                value={config.pathCount}
                onChange={(e) =>
                  onConfigChange({ pathCount: parseInt(e.target.value) || 100 })
                }
                className="w-full h-8 px-2 text-sm bg-background border border-border rounded-md"
                data-testid="simulation-path-count-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="minTime"
                className="text-xs text-muted-foreground"
              >
                Min time per card (s)
              </label>
              <input
                id="minTime"
                type="number"
                min={1}
                max={30}
                value={config.minTimePerCard / 1000}
                onChange={(e) =>
                  onConfigChange({
                    minTimePerCard: (parseFloat(e.target.value) || 3) * 1000,
                  })
                }
                className="w-full h-8 px-2 text-sm bg-background border border-border rounded-md"
                data-testid="simulation-min-time-input"
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="maxTime"
                className="text-xs text-muted-foreground"
              >
                Max time per card (s)
              </label>
              <input
                id="maxTime"
                type="number"
                min={5}
                max={60}
                value={config.maxTimePerCard / 1000}
                onChange={(e) =>
                  onConfigChange({
                    maxTimePerCard: (parseFloat(e.target.value) || 15) * 1000,
                  })
                }
                className="w-full h-8 px-2 text-sm bg-background border border-border rounded-md"
                data-testid="simulation-max-time-input"
              />
            </div>

            <div className="space-y-1 flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.weightByContent}
                  onChange={(e) =>
                    onConfigChange({ weightByContent: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-border"
                  data-testid="simulation-weight-content-checkbox"
                />
                <span className="text-xs text-muted-foreground">
                  Weight by content length
                </span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error display */}
      {state.error && (
        <div className="p-2 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-xs text-destructive">{state.error}</p>
        </div>
      )}
    </div>
  )
}
