'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Keyboard, WifiOff, Wifi, AlertTriangle, RefreshCw, RotateCcw, Info } from 'lucide-react'
import { ShortcutOverlay, WASM_PLAYER_SHORTCUTS } from './ShortcutOverlay'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type {
  CompiledStoryBundle,
  SerializedCard,
  SerializedChoice,
  BundleLoaderState,
  BundleValidationWarning,
  BundleLoadOptions,
} from '../lib/types'
import { WasmRuntime, createRuntime } from '../lib/runtime'
import { getErrorMessage, getErrorAction, hasLastKnownGood } from '../lib/validator'

interface WasmPlayerProps {
  bundle: CompiledStoryBundle
  saveKey?: string
  onComplete?: () => void
  showOfflineIndicator?: boolean
  /** Enable corruption-resistant loading with retry and fallback */
  enableValidation?: boolean
  /** Key for storing last known good bundle state */
  lastKnownGoodKey?: string
  /** Maximum retry attempts for corrupted bundles */
  maxRetries?: number
  /** Callback when bundle validation fails */
  onValidationError?: (error: unknown) => void
}

export function WasmPlayer({
  bundle,
  saveKey,
  onComplete,
  showOfflineIndicator = true,
  enableValidation = true,
  lastKnownGoodKey,
  maxRetries = 3,
  onValidationError,
}: WasmPlayerProps) {
  const runtimeRef = useRef<WasmRuntime | null>(null)
  const [currentCard, setCurrentCard] = useState<SerializedCard | null>(null)
  const [choices, setChoices] = useState<SerializedChoice[]>([])
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [loaderState, setLoaderState] = useState<BundleLoaderState | null>(null)
  const [validationProgress, setValidationProgress] = useState<string>('')
  const [showWarnings, setShowWarnings] = useState(false)
  const [isFallback, setIsFallback] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const bundleRef = useRef(bundle)

  // Keep bundleRef current
  useEffect(() => {
    bundleRef.current = bundle
  }, [bundle])

  // Initialize runtime with validation
  useEffect(() => {
    const initRuntime = async () => {
      setLoading(true)
      setLoaderState(null)
      setIsFallback(false)

      const runtime = createRuntime()

      const loadOptions: BundleLoadOptions = enableValidation
        ? {
            validateChecksum: true,
            validateSchema: true,
            maxRetries,
            retryDelay: 1000,
            lastKnownGoodKey: lastKnownGoodKey || `lkg_${bundle.metadata.id}`,
            onValidationProgress: setValidationProgress,
          }
        : {
            validateChecksum: false,
            validateSchema: false,
          }

      const loaded = await runtime.loadBundle(bundle, loadOptions)
      const finalLoaderState = runtime.getLoaderState()
      setLoaderState(finalLoaderState)

      if (!loaded) {
        console.error('Failed to load bundle')
        onValidationError?.(finalLoaderState.error)
        setLoading(false)
        return
      }

      // Check if we're using fallback
      if (finalLoaderState.status === 'fallback') {
        setIsFallback(true)
      }

      runtimeRef.current = runtime

      // Enable auto-save if key provided
      if (saveKey) {
        runtime.enableAutoSave(saveKey)
        // Try to restore previous state
        runtime.restoreState(saveKey)
      }

      // Subscribe to runtime events
      runtime.subscribe((event) => {
        if (event.type === 'card_entered') {
          updateUI()
        } else if (event.type === 'story_completed') {
          onComplete?.()
        }
      })

      // Start the story
      runtime.start()
      updateUI()
      setLoading(false)
    }

    initRuntime()

    return () => {
      runtimeRef.current?.destroy()
    }
  }, [bundle, saveKey, onComplete, enableValidation, lastKnownGoodKey, maxRetries, onValidationError])

  // Handle retry
  const handleRetry = useCallback(async () => {
    if (!runtimeRef.current) return
    setLoading(true)
    setLoaderState(null)
    const loaded = await runtimeRef.current.retryLoad(bundleRef.current)
    const finalLoaderState = runtimeRef.current.getLoaderState()
    setLoaderState(finalLoaderState)

    if (loaded) {
      runtimeRef.current.start()
      updateUI()
    }
    setLoading(false)
  }, [])

  // Handle fallback to last known good
  const handleLoadFallback = useCallback(() => {
    if (!runtimeRef.current || !lastKnownGoodKey) return
    const loaded = runtimeRef.current.loadLastKnownGood(lastKnownGoodKey)
    if (loaded) {
      setIsFallback(true)
      setLoaderState(runtimeRef.current.getLoaderState())
      runtimeRef.current.start()
      updateUI()
      setLoading(false)
    }
  }, [lastKnownGoodKey])

  // Update UI from runtime state
  const updateUI = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime) return

    const card = runtime.getCurrentCard()
    const cardChoices = runtime.getCurrentChoices()

    setCurrentCard(card)
    setChoices(cardChoices)
    setCanGoBack(runtime.canGoBack())
    setSelectedChoiceIndex(0)
  }, [])

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    setIsOnline(navigator.onLine)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Handle choice selection
  const handleChoiceClick = useCallback((choiceId: string) => {
    const runtime = runtimeRef.current
    if (!runtime) return

    runtime.selectChoice(choiceId)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handle back navigation
  const handleBack = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime || !runtime.canGoBack()) return

    runtime.goBack()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Handle restart
  const handleRestart = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime) return

    runtime.restart()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  // Navigate to last card (End key)
  const handleEnd = useCallback(() => {
    const runtime = runtimeRef.current
    if (!runtime) return

    // Navigate through the story until reaching a dead end
    let safety = 100 // Prevent infinite loops
    while (safety > 0) {
      const currentChoices = runtime.getCurrentChoices()
      if (currentChoices.length === 0) break // Reached end
      // Select the first choice to advance
      runtime.selectChoice(currentChoices[0].id)
      safety--
    }
    updateUI()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [updateUI])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if shortcut overlay is handling ESC
      if (showKeyboardHelp && event.key === 'Escape') {
        return // Let ShortcutOverlay handle it
      }

      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }

      // Handle Ctrl+K for toggling shortcuts overlay
      if (event.key === 'k' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault()
        setShowKeyboardHelp((prev) => !prev)
        return
      }

      switch (event.key) {
        case 'ArrowUp':
          event.preventDefault()
          if (choices.length > 0) {
            setSelectedChoiceIndex((prev) =>
              prev > 0 ? prev - 1 : choices.length - 1
            )
          }
          break

        case 'ArrowDown':
          event.preventDefault()
          if (choices.length > 0) {
            setSelectedChoiceIndex((prev) =>
              prev < choices.length - 1 ? prev + 1 : 0
            )
          }
          break

        case 'ArrowLeft':
          event.preventDefault()
          handleBack()
          break

        case 'ArrowRight':
        case ' ':
        case 'Enter':
          event.preventDefault()
          if (choices.length > 0 && choices[selectedChoiceIndex]) {
            handleChoiceClick(choices[selectedChoiceIndex].id)
          }
          break

        case 'Home':
          event.preventDefault()
          handleRestart()
          break

        case 'End':
          event.preventDefault()
          handleEnd()
          break

        case '?':
          event.preventDefault()
          setShowKeyboardHelp((prev) => !prev)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [choices, selectedChoiceIndex, handleChoiceClick, handleBack, handleRestart, handleEnd, showKeyboardHelp])

  // Get asset URL from runtime
  const getAssetUrl = useCallback((assetRef: string | null): string | null => {
    if (!assetRef || !runtimeRef.current) return null
    return runtimeRef.current.getAssetUrl(assetRef)
  }, [])

  // Determine if we can show fallback option
  const canUseFallback = lastKnownGoodKey && hasLastKnownGood(lastKnownGoodKey)

  if (loading) {
    const isRetrying = loaderState?.status === 'retrying'
    const isValidating = loaderState?.status === 'validating'
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-theme"
        data-testid="wasm-player-loading"
      >
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-lg font-semibold text-foreground">
            {isRetrying ? 'Retrying...' : isValidating ? 'Validating bundle...' : 'Loading story...'}
          </div>
          <div className="text-sm text-muted-foreground mt-1">
            {validationProgress || 'Running offline'}
          </div>
          {isRetrying && loaderState && (
            <div className="text-xs text-muted-foreground mt-2">
              Attempt {loaderState.retryCount} of {loaderState.maxRetries}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Error state with retry and fallback options
  if (loaderState?.status === 'error' && loaderState.error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-theme"
        data-testid="wasm-player-error"
      >
        <div className="text-center max-w-lg mx-auto p-8">
          <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-4 text-foreground" data-testid="wasm-player-error-title">
            Unable to Load Story
          </h1>
          <p className="text-muted-foreground mb-4" data-testid="wasm-player-error-message">
            {getErrorMessage(loaderState.error)}
          </p>
          <p className="text-sm text-muted-foreground mb-6">
            {getErrorAction(loaderState.error)}
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleRetry}
              variant="default"
              className="inline-flex items-center gap-2"
              data-testid="wasm-player-retry-btn"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>
            {canUseFallback && (
              <Button
                onClick={handleLoadFallback}
                variant="outline"
                className="inline-flex items-center gap-2"
                data-testid="wasm-player-fallback-btn"
              >
                <RotateCcw className="w-4 h-4" />
                Load Previous Version
              </Button>
            )}
          </div>

          {/* Technical details for debugging */}
          <details className="mt-6 text-left">
            <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground">
              Technical Details
            </summary>
            <pre className="mt-2 p-3 bg-muted rounded-lg text-xs overflow-auto max-h-40">
              {JSON.stringify(
                {
                  code: loaderState.error.code,
                  field: loaderState.error.field,
                  retryCount: loaderState.retryCount,
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>
      </div>
    )
  }

  if (!currentCard) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-theme"
        data-testid="wasm-player-empty"
      >
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4 text-foreground">Story not available</h1>
          <p className="text-muted-foreground mb-6">This story bundle appears to be empty.</p>
          {canUseFallback && (
            <Button
              onClick={handleLoadFallback}
              variant="outline"
              className="inline-flex items-center gap-2"
              data-testid="wasm-player-empty-fallback-btn"
            >
              <RotateCcw className="w-4 h-4" />
              Load Previous Version
            </Button>
          )}
        </div>
      </div>
    )
  }

  const imageUrl = getAssetUrl(currentCard.imageRef)

  return (
    <div
      className="min-h-screen bg-gradient-theme"
      ref={containerRef}
      tabIndex={-1}
      data-testid="wasm-player"
    >
      {/* Top bar */}
      <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
        {showOfflineIndicator && (
          <div
            className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-medium ${
              isOnline
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
            }`}
            data-testid="wasm-player-online-indicator"
          >
            {isOnline ? (
              <>
                <Wifi className="w-3 h-3" />
                Online
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3" />
                Offline
              </>
            )}
          </div>
        )}
        <button
          onClick={() => setShowKeyboardHelp((prev) => !prev)}
          className="p-2 rounded-lg bg-card/80 hover:bg-card border border-border text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Keyboard shortcuts"
          data-testid="wasm-player-keyboard-help-btn"
        >
          <Keyboard className="w-4 h-4" />
        </button>
        <ThemeToggle />
      </div>

      {/* Fallback mode banner */}
      {isFallback && (
        <div
          className="fixed top-0 left-0 right-0 z-40 bg-amber-100 dark:bg-amber-900/50 border-b border-amber-200 dark:border-amber-800 px-4 py-2"
          data-testid="wasm-player-fallback-banner"
        >
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>Running a previous version of this story. The latest version may be corrupted.</span>
            </div>
            <Button
              onClick={handleRetry}
              variant="ghost"
              size="sm"
              className="text-amber-800 dark:text-amber-200 hover:text-amber-900 dark:hover:text-amber-100"
              data-testid="wasm-player-fallback-retry-btn"
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Retry
            </Button>
          </div>
        </div>
      )}

      {/* Warnings banner */}
      {loaderState?.warnings && loaderState.warnings.length > 0 && !isFallback && (
        <div className="fixed top-0 left-0 right-0 z-40" data-testid="wasm-player-warnings-container">
          <button
            onClick={() => setShowWarnings(!showWarnings)}
            className="w-full bg-blue-100 dark:bg-blue-900/50 border-b border-blue-200 dark:border-blue-800 px-4 py-2 text-left"
            data-testid="wasm-player-warnings-toggle"
          >
            <div className="max-w-4xl mx-auto flex items-center gap-2 text-blue-800 dark:text-blue-200 text-sm">
              <Info className="w-4 h-4" />
              <span>{loaderState.warnings.length} warning{loaderState.warnings.length > 1 ? 's' : ''} found</span>
              <span className="text-xs">({showWarnings ? 'click to hide' : 'click to show'})</span>
            </div>
          </button>
          {showWarnings && (
            <div className="bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800 px-4 py-3">
              <div className="max-w-4xl mx-auto space-y-2">
                {loaderState.warnings.map((warning, index) => (
                  <div
                    key={index}
                    className="text-sm text-blue-800 dark:text-blue-200"
                    data-testid={`wasm-player-warning-${index}`}
                  >
                    <span className="font-medium">{warning.message}</span>
                    {warning.suggestion && (
                      <span className="text-blue-600 dark:text-blue-300 ml-2">— {warning.suggestion}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Keyboard shortcuts overlay */}
      <ShortcutOverlay
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
        shortcuts={WASM_PLAYER_SHORTCUTS}
        data-testid="wasm-player-keyboard-help"
      />

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 lg:py-12">
        {/* Story card */}
        <div
          className="bg-card rounded-lg shadow-xl overflow-hidden"
          data-testid="wasm-player-card"
        >
          {/* Image */}
          {imageUrl && (
            <div className="relative w-full aspect-video bg-muted overflow-hidden">
              <Image
                src={imageUrl}
                alt={currentCard.title}
                fill
                className="object-cover"
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 896px"
              />
            </div>
          )}

          {/* Content */}
          <div className="p-4 sm:p-6 md:p-8 lg:p-10">
            <h1
              className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6 text-center leading-tight text-foreground"
              data-testid="wasm-player-title"
            >
              {currentCard.title}
            </h1>

            <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none mb-6 sm:mb-8">
              <p
                className="leading-relaxed whitespace-pre-wrap text-center text-sm sm:text-base md:text-lg text-muted-foreground"
                data-testid="wasm-player-content"
              >
                {currentCard.content}
              </p>
            </div>

            {/* Choices */}
            {choices.length > 0 ? (
              <div className="space-y-2.5 sm:space-y-3 mt-6 sm:mt-8" data-testid="wasm-player-choices">
                {choices.map((choice, index) => (
                  <button
                    key={choice.id}
                    onClick={() => handleChoiceClick(choice.id)}
                    className={`w-full py-3 sm:py-4 md:py-5 lg:py-6 text-sm sm:text-base md:text-lg font-semibold rounded-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] min-h-[44px] border-2 bg-primary text-primary-foreground border-border hover:opacity-90 ${
                      index === selectedChoiceIndex
                        ? 'ring-2 ring-offset-2 ring-offset-card ring-primary'
                        : ''
                    }`}
                    data-testid={`wasm-player-choice-btn-${index}`}
                  >
                    {choice.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 sm:py-8" data-testid="wasm-player-end">
                <div className="inline-block px-4 sm:px-6 md:px-8 py-2.5 sm:py-3 md:py-4 rounded-lg border-2 bg-muted border-border">
                  <p className="text-base sm:text-lg md:text-xl font-semibold text-foreground">
                    The End
                  </p>
                  <p className="text-xs sm:text-sm mt-1 sm:mt-2 text-muted-foreground">
                    You've reached the end of this story path
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back button */}
        {canGoBack && (
          <div className="mt-4 sm:mt-6 text-center">
            <Button
              onClick={handleBack}
              variant="outline"
              className="inline-flex items-center gap-2 px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 text-sm sm:text-base min-h-[44px]"
              data-testid="wasm-player-back-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Back
            </Button>
          </div>
        )}

        {/* Story info footer */}
        <div className="mt-6 sm:mt-8 text-center text-xs sm:text-sm text-muted-foreground px-2">
          <p className="font-medium">{bundle.metadata.name}</p>
          {bundle.metadata.description && (
            <p className="mt-1 opacity-70">{bundle.metadata.description}</p>
          )}
          <p className="mt-2 text-xs opacity-50">Running offline</p>
        </div>
      </div>
    </div>
  )
}
