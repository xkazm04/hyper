'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { CheckCircle, AlertTriangle } from 'lucide-react'
import { ColorTokenResolver } from '../lib/color-token-resolver'
import { useTheme } from '@/contexts/ThemeContext'
import { useHighContrastContext } from '../HighContrastContext'
import { cn } from '@/lib/utils'
import {
  ContrastMetrics,
  ContrastPreview,
  ContrastControls
} from './sub_CardContrastPreview'

interface CardContrastPreviewProps {
  cardTitle?: string
  cardContent?: string
  choices?: string[]
  showInModal?: boolean
  onApply?: () => void
  onCancel?: () => void
  className?: string
}

/**
 * CardContrastPreview Component
 *
 * Provides a live preview of how story cards will appear with high contrast mode.
 * Shows contrast ratio information and WCAG compliance status.
 */
export function CardContrastPreview({
  cardTitle = 'The Dark Forest',
  cardContent = 'You stand at the edge of an ancient forest. The trees tower above you, their branches forming a canopy that blocks out most of the sunlight.',
  choices = ['Enter the forest', 'Go back home', 'Wait until nightfall'],
  showInModal = false,
  onApply,
  onCancel,
  className = ''
}: CardContrastPreviewProps) {
  const { theme } = useTheme()
  const { isHighContrast, enablePreview, disablePreview, applyPreview, isPreviewMode } = useHighContrastContext()
  const [localPreviewActive, setLocalPreviewActive] = useState(false)

  const isDarkTheme = theme === 'halloween'

  const previewResolver = useMemo(
    () => new ColorTokenResolver(isDarkTheme, true),
    [isDarkTheme]
  )

  const normalResolver = useMemo(
    () => new ColorTokenResolver(isDarkTheme, false),
    [isDarkTheme]
  )

  const contrastAnalysis = useMemo(
    () => previewResolver.getCardContrastAnalysis(),
    [previewResolver]
  )

  const allMeetWCAGAA = useMemo(
    () => contrastAnalysis.every(info => info.meetsAA),
    [contrastAnalysis]
  )

  useEffect(() => {
    if (!localPreviewActive) return

    const previewContainer = document.getElementById('card-contrast-preview-container')
    if (previewContainer) {
      previewResolver.applyCardTokensToElement(previewContainer)
    }

    return () => {
      if (previewContainer) {
        previewResolver.removeCardTokensFromElement(previewContainer)
      }
    }
  }, [localPreviewActive, previewResolver])

  const handleTogglePreview = useCallback(() => {
    const newState = !localPreviewActive
    setLocalPreviewActive(newState)
    if (newState) {
      enablePreview()
    } else {
      disablePreview()
    }
  }, [localPreviewActive, enablePreview, disablePreview])

  const handleApply = useCallback(() => {
    applyPreview()
    setLocalPreviewActive(false)
    onApply?.()
  }, [applyPreview, onApply])

  const handleCancel = useCallback(() => {
    disablePreview()
    setLocalPreviewActive(false)
    onCancel?.()
  }, [disablePreview, onCancel])

  return (
    <div className={cn('space-y-4', className)} data-testid="card-contrast-preview">
      <ContrastControls
        isHighContrast={isHighContrast}
        allMeetWCAGAA={allMeetWCAGAA}
        localPreviewActive={localPreviewActive}
        onTogglePreview={handleTogglePreview}
      />

      <ContrastMetrics contrastAnalysis={contrastAnalysis} />

      {localPreviewActive && (
        <ContrastPreview
          cardTitle={cardTitle}
          cardContent={cardContent}
          choices={choices}
          isDarkTheme={isDarkTheme}
          isHighContrast={isHighContrast}
          previewResolver={previewResolver}
          normalResolver={normalResolver}
          showInModal={showInModal}
          onApply={handleApply}
          onCancel={handleCancel}
        />
      )}
    </div>
  )
}

/**
 * Compact card contrast indicator for toolbar use
 */
export function CardContrastIndicator({ className = '' }: { className?: string }) {
  const { theme } = useTheme()
  const { isHighContrast } = useHighContrastContext()

  const isDarkTheme = theme === 'halloween'
  const resolver = useMemo(
    () => new ColorTokenResolver(isDarkTheme, isHighContrast),
    [isDarkTheme, isHighContrast]
  )

  const allMeet = useMemo(() => resolver.allCardTokensMeetWCAGAA(), [resolver])

  return (
    <div
      className={cn(
        'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium',
        allMeet
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
        className
      )}
      title={allMeet ? 'All card colors meet WCAG AA' : 'Some colors may not meet WCAG AA'}
      data-testid="card-contrast-indicator"
    >
      {allMeet ? (
        <CheckCircle className="w-3.5 h-3.5" />
      ) : (
        <AlertTriangle className="w-3.5 h-3.5" />
      )}
      <span>
        {isHighContrast ? 'AA' : 'Standard'}
      </span>
    </div>
  )
}
