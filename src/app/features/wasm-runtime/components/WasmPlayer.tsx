'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { ArrowLeft, Keyboard, WifiOff, Wifi } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import type { CompiledStoryBundle, SerializedCard, SerializedChoice } from '../lib/types'
import { WasmRuntime, createRuntime } from '../lib/runtime'

interface WasmPlayerProps {
  bundle: CompiledStoryBundle
  saveKey?: string
  onComplete?: () => void
  showOfflineIndicator?: boolean
}

export function WasmPlayer({
  bundle,
  saveKey,
  onComplete,
  showOfflineIndicator = true,
}: WasmPlayerProps) {
  const runtimeRef = useRef<WasmRuntime | null>(null)
  const [currentCard, setCurrentCard] = useState<SerializedCard | null>(null)
  const [choices, setChoices] = useState<SerializedChoice[]>([])
  const [loading, setLoading] = useState(true)
  const [canGoBack, setCanGoBack] = useState(false)
  const [selectedChoiceIndex, setSelectedChoiceIndex] = useState(0)
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)

  // Initialize runtime
  useEffect(() => {
    const initRuntime = async () => {
      setLoading(true)

      const runtime = createRuntime()
      const loaded = await runtime.loadBundle(bundle)

      if (!loaded) {
        console.error('Failed to load bundle')
        setLoading(false)
        return
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
  }, [bundle, saveKey, onComplete])

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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
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

        case '?':
          event.preventDefault()
          setShowKeyboardHelp((prev) => !prev)
          break

        case 'Escape':
          event.preventDefault()
          setShowKeyboardHelp(false)
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [choices, selectedChoiceIndex, handleChoiceClick, handleBack, handleRestart])

  // Get asset URL from runtime
  const getAssetUrl = useCallback((assetRef: string | null): string | null => {
    if (!assetRef || !runtimeRef.current) return null
    return runtimeRef.current.getAssetUrl(assetRef)
  }, [])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-theme"
        data-testid="wasm-player-loading"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-lg font-semibold text-foreground">Loading story...</div>
          <div className="text-sm text-muted-foreground mt-1">Running offline</div>
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

      {/* Keyboard shortcuts tooltip */}
      {showKeyboardHelp && (
        <div
          className="fixed top-16 right-4 z-50 bg-card border border-border rounded-lg shadow-lg p-4 max-w-xs"
          data-testid="wasm-player-keyboard-help"
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-foreground text-sm">Keyboard Shortcuts</h3>
            <button
              onClick={() => setShowKeyboardHelp(false)}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Close help"
              data-testid="wasm-player-keyboard-close-btn"
            >
              <span className="text-lg leading-none">&times;</span>
            </button>
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Navigate choices</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">↑ ↓</kbd>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Select choice</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">Space / Enter</kbd>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Go back</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">←</kbd>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Restart story</span>
              <kbd className="px-1.5 py-0.5 bg-muted rounded text-foreground font-mono">Home</kbd>
            </div>
          </div>
        </div>
      )}

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
