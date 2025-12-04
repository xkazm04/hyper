'use client'

import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  XCircle,
  Check,
  ArrowRight,
  Lightbulb,
  PenTool,
  Network,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAICompanion } from './useAICompanion'
import type { AICompanionMode, ContentVariant, NextStepSuggestion } from './types'

interface AICompanionBottomPanelProps {
  className?: string
  defaultExpanded?: boolean
  userId?: string | null
}

const modeConfig = {
  suggest: {
    label: 'Next Steps',
    icon: Lightbulb,
    description: 'Suggest what happens next in the story',
  },
  generate: {
    label: 'Write Content',
    icon: PenTool,
    description: 'Generate scene content variations',
  },
  architect: {
    label: 'Story Architect',
    icon: Network,
    description: 'Build story structure with multiple scenes',
  },
}

/**
 * AICompanionBottomPanel - Full-width bottom expandable AI companion
 *
 * Design:
 * - Fixed at bottom of the viewport within Cards module
 * - Expands upward when activated or when suggestions arrive
 * - Action buttons in bottom row with inline architect controls
 * - Suggestions/content in upper row
 * - Auto-collapses when suggestions are cleared
 */
export function AICompanionBottomPanel({ className, defaultExpanded = false }: AICompanionBottomPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  const {
    state,
    setMode,
    clearError,
    generateContentVariants,
    applyContentVariant,
    generateNextSteps,
    acceptNextStep,
    declineNextStep,
    dismissAllSuggestions,
    generateStoryStructure,
    storyCardsLength,
    currentCardId,
    hasCurrentCard,
  } = useAICompanion({ enabled: true })

  const { mode, isGenerating, error, contentVariants, nextStepSuggestions } = state

  // Architect form state
  const [architectLevels, setArchitectLevels] = useState(2)
  const [architectChoicesPerCard, setArchitectChoicesPerCard] = useState(2)

  const handleArchitectGenerate = () => {
    generateStoryStructure(architectLevels, architectChoicesPerCard)
  }

  const hasSuggestions = nextStepSuggestions.length > 0 || contentVariants.length > 0

  // Auto-expand when suggestions arrive, auto-collapse when cleared
  useEffect(() => {
    if (hasSuggestions && !isExpanded) {
      setIsExpanded(true)
    } else if (!hasSuggestions && !isGenerating && isExpanded) {
      setIsExpanded(false)
    }
  }, [hasSuggestions, isGenerating])

  // Calculate total cards for architect mode preview
  const calculateTotalCards = () => {
    let total = 0
    for (let i = 1; i <= architectLevels; i++) {
      total += Math.pow(architectChoicesPerCard, i)
    }
    return total
  }

  return (
    <div
      className={cn(
        'bg-card/98 border-t-2 border-x-2 border-border rounded-t-xl shadow-2xl backdrop-blur-md transition-all duration-300',
        className
      )}
      data-testid="ai-companion-bottom"
    >
      {/* Expanded Content - Upper Row (Suggestions) */}
      {isExpanded && (
        <div className="border-b border-border overflow-hidden">
          {/* Error Display */}
          {error && (
            <div className="px-4 py-2 bg-destructive/10 border-b border-destructive/20">
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={clearError} className="hover:opacity-70">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Content Area */}
          <div className="max-h-[300px] overflow-y-auto">
            <div className="p-4">
              {/* === SUGGEST MODE CONTENT === */}
              {mode === 'suggest' && (
                <SuggestContent
                  suggestions={nextStepSuggestions}
                  isGenerating={isGenerating}
                  storyCardsLength={storyCardsLength}
                  currentCardId={currentCardId}
                  onAccept={acceptNextStep}
                  onDecline={declineNextStep}
                  onDismissAll={dismissAllSuggestions}
                />
              )}

              {/* === GENERATE MODE CONTENT === */}
              {mode === 'generate' && (
                <GenerateContent
                  variants={contentVariants}
                  isGenerating={isGenerating}
                  hasCurrentCard={hasCurrentCard}
                  onApply={applyContentVariant}
                />
              )}

              {/* === ARCHITECT MODE CONTENT - Only show generating state === */}
              {mode === 'architect' && isGenerating && (
                <div className="text-center py-6">
                  <Loader2 className="w-10 h-10 text-purple-500/50 mx-auto mb-3 animate-spin" />
                  <p className="text-sm text-muted-foreground">Building your story tree...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Row - Actions and Mode Selector */}
      <div className="flex items-center gap-2 p-3">
        {/* Toggle Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors"
          data-testid="ai-companion-toggle"
        >
          <div className="p-1.5 bg-purple-500/10 rounded">
            <Sparkles className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-left hidden sm:block">
            <h3 className="text-xs font-bold text-foreground">AI Companion</h3>
          </div>
          {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-500" />}
          {hasSuggestions && !isGenerating && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-purple-500/20 text-purple-600 dark:text-purple-400 rounded">
              {nextStepSuggestions.length + contentVariants.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          )}
        </button>

        {/* Separator */}
        <div className="h-8 w-px bg-border" />

        {/* Mode Action Buttons */}
        <div className="flex items-center gap-1">
          {(Object.keys(modeConfig) as AICompanionMode[]).map((m) => {
            const config = modeConfig[m]
            const Icon = config.icon
            const isActive = mode === m

            return (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 text-xs font-medium rounded-lg transition-all',
                  isActive
                    ? 'bg-purple-500/15 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
                data-testid={`ai-mode-${m}`}
                title={config.description}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{config.label}</span>
              </button>
            )
          })}
        </div>

        {/* Architect Inline Controls - Show level/choice selectors next to mode buttons */}
        {mode === 'architect' && (
          <>
            <div className="h-8 w-px bg-border" />
            <div className="flex items-center gap-3">
              {/* Levels */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground hidden lg:inline">Levels:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setArchitectLevels(n)}
                      disabled={isGenerating}
                      className={cn(
                        'w-6 h-6 rounded-full text-xs font-bold transition-all duration-150',
                        'border flex items-center justify-center',
                        architectLevels === n
                          ? 'bg-purple-500 text-white border-purple-500 scale-110'
                          : 'bg-transparent border-border text-muted-foreground hover:border-purple-400 hover:text-foreground',
                        isGenerating && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Choices per card */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] text-muted-foreground hidden lg:inline">Choices:</span>
                <div className="flex items-center gap-0.5">
                  {[1, 2].map((n) => (
                    <button
                      key={n}
                      onClick={() => setArchitectChoicesPerCard(n)}
                      disabled={isGenerating}
                      className={cn(
                        'w-6 h-6 rounded-full text-xs font-bold transition-all duration-150',
                        'border flex items-center justify-center',
                        architectChoicesPerCard === n
                          ? 'bg-purple-500 text-white border-purple-500 scale-110'
                          : 'bg-transparent border-border text-muted-foreground hover:border-purple-400 hover:text-foreground',
                        isGenerating && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview count */}
              <span className="text-xs text-muted-foreground hidden sm:inline">
                = <span className="font-medium text-foreground">{calculateTotalCards()}</span>
              </span>
            </div>
          </>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Primary Action Button - Purple themed */}
        <div className="flex items-center gap-2">
          {mode === 'suggest' && (
            <Button
              size="sm"
              onClick={() => generateNextSteps(currentCardId || undefined)}
              disabled={isGenerating || !currentCardId}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Lightbulb className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Generate Ideas</span>
            </Button>
          )}

          {mode === 'generate' && (
            <Button
              size="sm"
              onClick={generateContentVariants}
              disabled={isGenerating || !hasCurrentCard}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <PenTool className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Write Scene</span>
            </Button>
          )}

          {mode === 'architect' && (
            <Button
              size="sm"
              onClick={handleArchitectGenerate}
              disabled={isGenerating || !hasCurrentCard}
              className="gap-1.5 bg-purple-600 hover:bg-purple-700 text-white"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Network className="w-3.5 h-3.5" />
              )}
              <span className="hidden sm:inline">Generate Tree</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// === Sub-components for Content Display ===

interface SuggestContentProps {
  suggestions: NextStepSuggestion[]
  isGenerating: boolean
  storyCardsLength: number
  currentCardId: string | null
  onAccept: (suggestion: NextStepSuggestion) => void
  onDecline: (id: string) => void
  onDismissAll: () => void
}

function SuggestContent({
  suggestions,
  isGenerating,
  storyCardsLength,
  currentCardId,
  onAccept,
  onDecline,
  onDismissAll,
}: SuggestContentProps) {
  if (storyCardsLength === 0) {
    return (
      <EmptyState
        icon={Wand2}
        message="Create your first card to get AI suggestions"
      />
    )
  }

  if (suggestions.length === 0 && !isGenerating) {
    return (
      <EmptyState
        icon={Lightbulb}
        message={currentCardId ? "Click 'Generate Ideas' to get story suggestions" : "Select a card to get suggestions"}
      />
    )
  }

  if (isGenerating && suggestions.length === 0) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-10 h-10 text-primary/50 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-muted-foreground">Thinking about what happens next...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">
          {suggestions.length} Story Suggestions
        </p>
        <button
          onClick={onDismissAll}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          Clear all
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => onAccept(suggestion)}
            onDecline={() => onDecline(suggestion.id)}
          />
        ))}
      </div>
    </div>
  )
}

interface SuggestionCardProps {
  suggestion: NextStepSuggestion
  onAccept: () => void
  onDecline: () => void
}

function SuggestionCard({ suggestion, onAccept, onDecline }: SuggestionCardProps) {
  const confidenceColor =
    suggestion.confidence >= 0.7
      ? 'bg-emerald-500'
      : suggestion.confidence >= 0.4
      ? 'bg-amber-500'
      : 'bg-red-400'

  return (
    <div className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', confidenceColor)} />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground truncate">{suggestion.title}</h4>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{suggestion.content}</p>
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-primary flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          {suggestion.choiceLabel}
        </span>
        <div className="flex gap-1.5">
          <Button size="sm" variant="ghost" onClick={onDecline} className="h-7 px-2">
            <XCircle className="w-3.5 h-3.5" />
          </Button>
          <Button size="sm" onClick={onAccept} className="h-7 px-2 gap-1">
            <Check className="w-3.5 h-3.5" />
            Accept
          </Button>
        </div>
      </div>
    </div>
  )
}

interface GenerateContentProps {
  variants: ContentVariant[]
  isGenerating: boolean
  hasCurrentCard: boolean
  onApply: (variant: ContentVariant) => void
}

function GenerateContent({
  variants,
  isGenerating,
  hasCurrentCard,
  onApply,
}: GenerateContentProps) {
  if (!hasCurrentCard) {
    return (
      <EmptyState
        icon={PenTool}
        message="Select a card to generate content"
      />
    )
  }

  if (variants.length === 0 && !isGenerating) {
    return (
      <EmptyState
        icon={FileText}
        message="Click 'Write Scene' to generate content variations for your scene"
      />
    )
  }

  if (isGenerating) {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-10 h-10 text-primary/50 mx-auto mb-3 animate-spin" />
        <p className="text-sm text-muted-foreground">Writing your scene...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-foreground">Choose a version:</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {variants.map((variant, index) => (
          <div
            key={variant.id}
            className="p-3 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 hover:border-primary/50 transition-colors cursor-pointer group"
            onClick={() => onApply(variant)}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <h4 className="text-sm font-semibold text-foreground">
                Option {index + 1}: {variant.title}
              </h4>
              <span className="text-xs text-muted-foreground shrink-0">
                {Math.round(variant.confidence * 100)}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-3">{variant.content}</p>

            {/* Display generated choices if present */}
            {variant.choices && variant.choices.length > 0 && (
              <div className="mt-2 pt-2 border-t border-border/50">
                <p className="text-[10px] font-medium text-muted-foreground mb-1">
                  {variant.choices.length} choice{variant.choices.length > 1 ? 's' : ''} included:
                </p>
                <div className="flex flex-wrap gap-1">
                  {variant.choices.map((choice, i) => (
                    <span
                      key={i}
                      className="px-1.5 py-0.5 text-[10px] bg-primary/10 text-primary rounded"
                    >
                      {choice.label}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <Button size="sm" variant="ghost" className="mt-2 h-7 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
              <Check className="w-3 h-3 mr-1" />
              Apply{variant.choices && variant.choices.length > 0 ? ' with choices' : ''}
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon: typeof Wand2
  message: string
}

function EmptyState({ icon: Icon, message }: EmptyStateProps) {
  return (
    <div className="text-center py-6">
      <Icon className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  )
}
