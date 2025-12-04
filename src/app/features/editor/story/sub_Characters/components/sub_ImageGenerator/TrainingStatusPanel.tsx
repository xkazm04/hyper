'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Sparkles, CheckCircle2, AlertCircle, Brain, Zap, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Character, BriaModelStatus } from '@/lib/types'

interface TrainingStatusPanelProps {
  character: Character
  storyStackId: string
  onTrainingStatusChange?: (status: BriaModelStatus) => void
}

const MIN_IMAGES_FOR_TRAINING = 5
const MAX_CHARACTER_IMAGES = 10

/**
 * TrainingStatusPanel - Shows training progress and controls for Bria AI model
 * Features a beautiful progress indicator and animated states
 */
export function TrainingStatusPanel({
  character,
  storyStackId,
  onTrainingStatusChange,
}: TrainingStatusPanelProps) {
  const [isStartingTraining, setIsStartingTraining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pollingStatus, setPollingStatus] = useState<BriaModelStatus | null>(null)
  const [pollingError, setPollingError] = useState<string | null>(null)

  const imageCount = character.imageUrls?.length || 0
  const canTrain = imageCount >= MIN_IMAGES_FOR_TRAINING
  const currentStatus = pollingStatus || character.briaModelStatus || 'none'
  const isTraining = currentStatus === 'training' || currentStatus === 'pending'
  const isCompleted = currentStatus === 'completed'
  const isFailed = currentStatus === 'failed'

  // Combined error message from local state or polling
  const displayError = error || pollingError || character.briaErrorMessage

  // Poll for training status when training is in progress
  // Poll faster (3s) when pending to catch initialization errors quickly
  // Poll slower (30s) when training is actually running
  useEffect(() => {
    if (!isTraining) return

    // Poll immediately on mount
    const pollStatus = async () => {
      try {
        const response = await fetch(
          `/api/ai/bria/model?characterId=${character.id}&storyStackId=${storyStackId}`
        )
        if (response.ok) {
          const data = await response.json()
          setPollingStatus(data.status)
          if (data.errorMessage) {
            setPollingError(data.errorMessage)
          }
          if (data.status === 'completed' || data.status === 'failed') {
            onTrainingStatusChange?.(data.status)
            return true // Signal to stop polling
          }
        }
      } catch (err) {
        console.error('Error polling training status:', err)
      }
      return false
    }

    // Initial poll
    pollStatus()

    // Poll every 3 seconds when pending (to catch init errors fast), 30 seconds when training
    const pollIntervalMs = currentStatus === 'pending' ? 3000 : 30000
    const pollInterval = setInterval(async () => {
      const shouldStop = await pollStatus()
      if (shouldStop) {
        clearInterval(pollInterval)
      }
    }, pollIntervalMs)

    return () => clearInterval(pollInterval)
  }, [isTraining, currentStatus, character.id, storyStackId, onTrainingStatusChange])

  const handleStartTraining = useCallback(async () => {
    if (!canTrain || isStartingTraining) return

    setIsStartingTraining(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/bria/train', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: character.id,
          storyStackId,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to start training')
      }

      setPollingStatus('pending')
      onTrainingStatusChange?.('pending')
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start training'
      setError(errorMessage)
      setPollingStatus('failed')
      onTrainingStatusChange?.('failed')
    } finally {
      setIsStartingTraining(false)
    }
  }, [canTrain, isStartingTraining, character.id, storyStackId, onTrainingStatusChange])

  const handleRetry = useCallback(() => {
    setPollingStatus('none')
    setError(null)
    setPollingError(null)
  }, [])

  // Progress bar for image collection
  const progressPercent = Math.min((imageCount / MIN_IMAGES_FOR_TRAINING) * 100, 100)
  const totalProgressPercent = (imageCount / MAX_CHARACTER_IMAGES) * 100

  return (
    <div className="rounded-xl border-2 border-border bg-card overflow-hidden">
      {/* Header with gradient */}
      <div className={cn(
        'px-4 py-3 border-b-2 border-border',
        isCompleted && 'bg-gradient-to-r from-green-500/10 to-emerald-500/10',
        isTraining && 'bg-gradient-to-r from-blue-500/10 to-purple-500/10',
        isFailed && 'bg-gradient-to-r from-red-500/10 to-orange-500/10',
        !isCompleted && !isTraining && !isFailed && 'bg-muted/50'
      )}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            ) : isTraining ? (
              <Brain className="w-5 h-5 text-blue-500 animate-pulse" />
            ) : isFailed ? (
              <AlertCircle className="w-5 h-5 text-red-500" />
            ) : (
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            )}
            <span className="font-semibold text-sm">
              {isCompleted ? 'AI Model Ready' : isTraining ? 'Training AI Model' : isFailed ? 'Training Failed' : 'AI Character Training'}
            </span>
          </div>
          {isCompleted && (
            <span className="text-xs bg-green-500/20 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full font-medium">
              Active
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Image Progress Section */}
        {!isTraining && !isCompleted && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Training Images</span>
              <span className={cn(
                'font-medium',
                canTrain ? 'text-green-600 dark:text-green-400' : 'text-foreground'
              )}>
                {imageCount} / {MIN_IMAGES_FOR_TRAINING} minimum
              </span>
            </div>

            {/* Dual progress bar */}
            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
              {/* Total capacity indicator */}
              <div
                className="absolute inset-y-0 left-0 bg-muted-foreground/20 rounded-full"
                style={{ width: `${totalProgressPercent}%` }}
              />
              {/* Training threshold progress */}
              <div
                className={cn(
                  'absolute inset-y-0 left-0 rounded-full transition-all duration-500',
                  canTrain
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-blue-500 to-purple-500'
                )}
                style={{ width: `${progressPercent}%` }}
              />
              {/* Threshold marker */}
              <div
                className="absolute inset-y-0 w-0.5 bg-foreground/30"
                style={{ left: '100%' }}
              />
            </div>

            <p className="text-xs text-muted-foreground">
              {canTrain
                ? `Ready to train! You can add up to ${MAX_CHARACTER_IMAGES - imageCount} more images for better results.`
                : `Add ${MIN_IMAGES_FOR_TRAINING - imageCount} more image${MIN_IMAGES_FOR_TRAINING - imageCount !== 1 ? 's' : ''} to enable AI training.`
              }
            </p>
          </div>
        )}

        {/* Training Status */}
        {isTraining && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
              <div className="relative">
                <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-blue-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">Training in Progress</p>
                <p className="text-xs text-muted-foreground">
                  This typically takes 1-3 hours. You can continue working.
                </p>
              </div>
            </div>

            {/* Animated progress dots */}
            <div className="flex justify-center gap-1.5">
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed State */}
        {isCompleted && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-green-600 dark:text-green-400">
                  Model Trained Successfully
                </p>
                <p className="text-xs text-muted-foreground">
                  You can now insert {character.name} into any scene!
                </p>
              </div>
            </div>

            {character.briaCaptionPrefix && (
              <div className="p-2 rounded bg-muted/50 border border-border">
                <p className="text-xs text-muted-foreground mb-1">AI Description:</p>
                <p className="text-xs italic line-clamp-2">{character.briaCaptionPrefix}</p>
              </div>
            )}
          </div>
        )}

        {/* Failed State */}
        {isFailed && (
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm text-red-600 dark:text-red-400">
                  Training Failed
                </p>
                <p className="text-xs text-muted-foreground mt-1 break-words">
                  {displayError || 'An error occurred during training. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message (when not in failed state) */}
        {displayError && !isFailed && (
          <div className="p-2 rounded bg-destructive/10 border border-destructive/30">
            <p className="text-xs text-destructive break-words">{displayError}</p>
          </div>
        )}

        {/* Action Button */}
        {!isTraining && !isCompleted && canTrain && (
          <Button
            onClick={handleStartTraining}
            disabled={isStartingTraining}
            className={cn(
              'w-full border-2 border-border',
              'shadow-[3px_3px_0px_0px_hsl(var(--border))]',
              'hover:shadow-[4px_4px_0px_0px_hsl(var(--border))]',
              'hover:-translate-x-px hover:-translate-y-px',
              'transition-all duration-200',
              'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white'
            )}
          >
            {isStartingTraining ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Train AI Model
              </>
            )}
          </Button>
        )}

        {isFailed && (
          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full border-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry Training
          </Button>
        )}
      </div>
    </div>
  )
}

export default TrainingStatusPanel
