'use client'

import React, { memo, useState } from 'react'
import { useThemeLayer } from '../ThemeLayerContext'
import { cn } from '@/lib/utils'
import { Sparkles, Volume2, VolumeX, Eye, EyeOff, Sliders, Minus, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ThemeLayerControlsProps {
  className?: string
  showIntensitySlider?: boolean
  compact?: boolean
}

/**
 * ThemeLayerControls
 *
 * UI controls for the Halloween theme layer:
 * - Toggle visual effects on/off
 * - Toggle sound effects on/off
 * - Adjust effect intensity
 */
export const ThemeLayerControls = memo(function ThemeLayerControls({
  className,
  showIntensitySlider = false,
  compact = false,
}: ThemeLayerControlsProps) {
  const themeLayer = useThemeLayer()
  const [showIntensity, setShowIntensity] = useState(false)

  // Only show controls in Halloween theme
  if (themeLayer.theme !== 'halloween') {
    return null
  }

  const handleIntensityChange = (delta: number) => {
    const newValue = Math.max(0, Math.min(1, themeLayer.intensity + delta))
    themeLayer.setIntensity(newValue)
  }

  if (compact) {
    return (
      <div className={cn('flex items-center gap-1', className)} data-testid="theme-layer-controls-compact">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={themeLayer.toggleEffects}
                data-testid="toggle-effects-btn"
              >
                {themeLayer.effectsEnabled ? (
                  <Eye className="h-4 w-4 text-purple-400" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{themeLayer.effectsEnabled ? 'Disable' : 'Enable'} Halloween effects</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={themeLayer.toggleSounds}
                data-testid="toggle-sounds-btn"
              >
                {themeLayer.soundsEnabled ? (
                  <Volume2 className="h-4 w-4 text-orange-400" />
                ) : (
                  <VolumeX className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{themeLayer.soundsEnabled ? 'Mute' : 'Unmute'} Halloween sounds</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'flex items-center gap-2 p-2 rounded-lg',
        'bg-card/50 border border-border',
        className
      )}
      data-testid="theme-layer-controls"
    >
      {/* Effects toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={themeLayer.effectsEnabled ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'gap-1.5',
                themeLayer.effectsEnabled && 'bg-purple-500/20 hover:bg-purple-500/30'
              )}
              onClick={themeLayer.toggleEffects}
              data-testid="toggle-effects-btn"
            >
              {themeLayer.effectsEnabled ? (
                <Sparkles className="h-4 w-4 text-purple-400" />
              ) : (
                <EyeOff className="h-4 w-4" />
              )}
              <span className="text-xs">Effects</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{themeLayer.effectsEnabled ? 'Disable' : 'Enable'} visual effects</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Sounds toggle */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={themeLayer.soundsEnabled ? 'secondary' : 'ghost'}
              size="sm"
              className={cn(
                'gap-1.5',
                themeLayer.soundsEnabled && 'bg-orange-500/20 hover:bg-orange-500/30'
              )}
              onClick={themeLayer.toggleSounds}
              data-testid="toggle-sounds-btn"
            >
              {themeLayer.soundsEnabled ? (
                <Volume2 className="h-4 w-4 text-orange-400" />
              ) : (
                <VolumeX className="h-4 w-4" />
              )}
              <span className="text-xs">Sounds</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{themeLayer.soundsEnabled ? 'Mute' : 'Unmute'} sound effects</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Intensity control (optional) */}
      {showIntensitySlider && (
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5"
            onClick={() => setShowIntensity(!showIntensity)}
            data-testid="intensity-toggle-btn"
          >
            <Sliders className="h-4 w-4" />
            <span className="text-xs">{Math.round(themeLayer.intensity * 100)}%</span>
          </Button>

          {showIntensity && (
            <div
              className="absolute top-full mt-2 right-0 bg-card border border-border rounded-lg p-3 shadow-lg z-50 min-w-[200px]"
              data-testid="intensity-panel"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Effect Intensity</span>
                <span className="text-xs text-muted-foreground">
                  {Math.round(themeLayer.intensity * 100)}%
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleIntensityChange(-0.1)}
                  disabled={themeLayer.intensity <= 0}
                  data-testid="intensity-decrease-btn"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-purple-500 transition-all"
                    style={{ width: `${themeLayer.intensity * 100}%` }}
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => handleIntensityChange(0.1)}
                  disabled={themeLayer.intensity >= 1}
                  data-testid="intensity-increase-btn"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Adjust the intensity of Halloween visual effects
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
})

export default ThemeLayerControls
