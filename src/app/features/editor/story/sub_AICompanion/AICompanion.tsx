'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  Sparkles,
  Wand2,
  Loader2,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  AlertCircle,
  XCircle,
  Check,
  ArrowRight,
  Lightbulb,
  PenTool,
  Network,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAICompanion } from './useAICompanion'
import type { AICompanionMode, ContentVariant, NextStepSuggestion } from './types'

interface AICompanionProps {
  className?: string
  defaultExpanded?: boolean
  userId?: string | null
}

const modeConfig = {
  suggest: {
    label: 'Next Steps',
    icon: Lightbulb,
    description: 'AI suggests what happens next',
  },
  generate: {
    label: 'Write Content',
    icon: PenTool,
    description: 'AI writes this scene',
  },
  architect: {
    label: 'Story Architect',
    icon: Network,
    description: 'Build story structure',
  },
}

export function AICompanion({ className, defaultExpanded = false }: AICompanionProps) {
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
  const [architectDescription, setArchitectDescription] = useState('')
  const [architectCardCount, setArchitectCardCount] = useState(5)

  const handleArchitectGenerate = () => {
    generateStoryStructure(architectDescription, architectCardCount)
    setArchitectDescription('')
  }

  const ModeIcon = modeConfig[mode].icon

  return (
    <div
      className={cn(
        'bg-card/95 border-2 border-border rounded-lg shadow-lg backdrop-blur-sm transition-all duration-300 overflow-hidden',
        className
      )}
      data-testid="ai-companion"
    >
      {/* Header - Always visible */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
        data-testid="ai-companion-toggle"
      >
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-primary/10 rounded">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground">AI Story Companion</h3>
            <p className="text-[10px] text-muted-foreground">{modeConfig[mode].description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isGenerating && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
          {nextStepSuggestions.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-medium bg-primary/20 text-primary rounded">
              {nextStepSuggestions.length}
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Mode Selector */}
          <div className="flex border-b border-border">
            {(Object.keys(modeConfig) as AICompanionMode[]).map((m) => {
              const config = modeConfig[m]
              const Icon = config.icon
              const isActive = mode === m

              return (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary border-b-2 border-primary -mb-px'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  data-testid={`ai-mode-${m}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">{config.label}</span>
                </button>
              )
            })}
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-destructive/10 border-b border-destructive/20">
              <div className="flex items-center gap-2 text-xs text-destructive">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="flex-1">{error}</span>
                <button onClick={clearError} className="hover:opacity-70">
                  <XCircle className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* Mode Content */}
          <div className="p-3 space-y-3">
            {/* === SUGGEST MODE === */}
            {mode === 'suggest' && (
              <SuggestModeContent
                suggestions={nextStepSuggestions}
                isGenerating={isGenerating}
                storyCardsLength={storyCardsLength}
                currentCardId={currentCardId}
                onGenerate={() => generateNextSteps(currentCardId || undefined)}
                onAccept={acceptNextStep}
                onDecline={declineNextStep}
                onDismissAll={dismissAllSuggestions}
              />
            )}

            {/* === GENERATE MODE === */}
            {mode === 'generate' && (
              <GenerateModeContent
                variants={contentVariants}
                isGenerating={isGenerating}
                hasCurrentCard={hasCurrentCard}
                onGenerate={generateContentVariants}
                onApply={applyContentVariant}
              />
            )}

            {/* === ARCHITECT MODE === */}
            {mode === 'architect' && (
              <ArchitectModeContent
                description={architectDescription}
                cardCount={architectCardCount}
                isGenerating={isGenerating}
                onDescriptionChange={setArchitectDescription}
                onCardCountChange={setArchitectCardCount}
                onGenerate={handleArchitectGenerate}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// === Sub-components ===

interface SuggestModeContentProps {
  suggestions: NextStepSuggestion[]
  isGenerating: boolean
  storyCardsLength: number
  currentCardId: string | null
  onGenerate: () => void
  onAccept: (suggestion: NextStepSuggestion) => void
  onDecline: (id: string) => void
  onDismissAll: () => void
}

function SuggestModeContent({
  suggestions,
  isGenerating,
  storyCardsLength,
  currentCardId,
  onGenerate,
  onAccept,
  onDecline,
  onDismissAll,
}: SuggestModeContentProps) {
  if (storyCardsLength === 0) {
    return (
      <div className="text-center py-4">
        <Wand2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Create your first card to get AI suggestions</p>
      </div>
    )
  }

  if (suggestions.length === 0 && !isGenerating) {
    return (
      <div className="text-center py-4">
        <Lightbulb className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-3">
          {currentCardId ? 'Ready to suggest what happens next' : 'Select a card to get suggestions'}
        </p>
        <Button
          size="sm"
          onClick={onGenerate}
          disabled={!currentCardId}
          className="gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Generate Ideas
        </Button>
      </div>
    )
  }

  if (isGenerating && suggestions.length === 0) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-8 h-8 text-primary/50 mx-auto mb-2 animate-spin" />
        <p className="text-xs text-muted-foreground">Thinking about what happens next...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">{suggestions.length}</span> suggestions
        </p>
        <div className="flex gap-1.5">
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className={cn(
              'flex items-center gap-1 px-2 py-1 text-xs font-medium rounded',
              'bg-primary/10 text-primary hover:bg-primary/20',
              'disabled:opacity-50 disabled:cursor-not-allowed'
            )}
          >
            <RefreshCw className={cn('w-3 h-3', isGenerating && 'animate-spin')} />
            Refresh
          </button>
          <button
            onClick={onDismissAll}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded bg-muted text-muted-foreground hover:bg-muted/80"
          >
            <XCircle className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Suggestion cards */}
      <div className="space-y-2">
        {suggestions.map((suggestion) => (
          <SuggestionCard
            key={suggestion.id}
            suggestion={suggestion}
            onAccept={() => onAccept(suggestion)}
            onDecline={() => onDecline(suggestion.id)}
          />
        ))}
      </div>

      {/* Confidence legend */}
      <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          High
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          Medium
        </span>
        <span className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          Low
        </span>
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
    <div className="p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors">
      <div className="flex items-start gap-2 mb-2">
        <div className={cn('w-2 h-2 rounded-full mt-1.5 shrink-0', confidenceColor)} />
        <div className="flex-1 min-w-0">
          <h4 className="text-xs font-semibold text-foreground truncate">{suggestion.title}</h4>
          <p className="text-[10px] text-muted-foreground line-clamp-2">{suggestion.content}</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-[10px] text-primary flex items-center gap-1">
          <ArrowRight className="w-3 h-3" />
          {suggestion.choiceLabel}
        </span>
        <div className="flex gap-1">
          <button
            onClick={onAccept}
            className="p-1 rounded bg-primary/10 text-primary hover:bg-primary/20"
            title="Accept suggestion"
          >
            <Check className="w-3 h-3" />
          </button>
          <button
            onClick={onDecline}
            className="p-1 rounded bg-muted text-muted-foreground hover:bg-muted/80"
            title="Decline suggestion"
          >
            <XCircle className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  )
}

interface GenerateModeContentProps {
  variants: ContentVariant[]
  isGenerating: boolean
  hasCurrentCard: boolean
  onGenerate: () => void
  onApply: (variant: ContentVariant) => void
}

function GenerateModeContent({
  variants,
  isGenerating,
  hasCurrentCard,
  onGenerate,
  onApply,
}: GenerateModeContentProps) {
  if (!hasCurrentCard) {
    return (
      <div className="text-center py-4">
        <PenTool className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground">Select a card to generate content</p>
      </div>
    )
  }

  if (variants.length === 0 && !isGenerating) {
    return (
      <div className="text-center py-4">
        <PenTool className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
        <p className="text-xs text-muted-foreground mb-3">
          Generate 3 content variations for your current scene
        </p>
        <Button size="sm" onClick={onGenerate} className="gap-1.5">
          <Wand2 className="w-3.5 h-3.5" />
          Write Scene
        </Button>
      </div>
    )
  }

  if (isGenerating) {
    return (
      <div className="text-center py-4">
        <Loader2 className="w-8 h-8 text-primary/50 mx-auto mb-2 animate-spin" />
        <p className="text-xs text-muted-foreground">Writing your scene...</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">Choose a version:</p>
        <button
          onClick={onGenerate}
          className="text-xs text-primary hover:underline flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" />
          Regenerate
        </button>
      </div>
      {variants.map((variant, index) => (
        <div
          key={variant.id}
          className="p-2.5 rounded-lg border border-border bg-muted/30 hover:bg-muted/50 transition-colors cursor-pointer"
          onClick={() => onApply(variant)}
        >
          <div className="flex items-start justify-between gap-2 mb-1">
            <h4 className="text-xs font-semibold text-foreground">
              Option {index + 1}: {variant.title}
            </h4>
            <span className="text-[10px] text-muted-foreground shrink-0">
              {Math.round(variant.confidence * 100)}%
            </span>
          </div>
          <p className="text-[10px] text-muted-foreground line-clamp-3">{variant.content}</p>
          <button className="mt-2 text-[10px] text-primary hover:underline flex items-center gap-1">
            <Check className="w-3 h-3" />
            Apply this version
          </button>
        </div>
      ))}
    </div>
  )
}

interface ArchitectModeContentProps {
  description: string
  cardCount: number
  isGenerating: boolean
  onDescriptionChange: (value: string) => void
  onCardCountChange: (value: number) => void
  onGenerate: () => void
}

function ArchitectModeContent({
  description,
  cardCount,
  isGenerating,
  onDescriptionChange,
  onCardCountChange,
  onGenerate,
}: ArchitectModeContentProps) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Story Idea / Direction</Label>
        <Textarea
          placeholder="Describe the plot twist, new location, or character arc..."
          className="h-20 text-xs bg-background border-input placeholder:text-muted-foreground/50 resize-none"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          disabled={isGenerating}
        />
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs font-semibold text-muted-foreground">Scenes to Generate</Label>
        <Input
          type="number"
          min={1}
          max={20}
          value={cardCount}
          onChange={(e) => onCardCountChange(parseInt(e.target.value) || 5)}
          className="h-8 text-xs bg-background border-input"
          disabled={isGenerating}
        />
      </div>

      <Button
        onClick={onGenerate}
        disabled={isGenerating || !description.trim()}
        className="w-full"
        size="sm"
      >
        {isGenerating ? (
          <>
            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="w-3.5 h-3.5 mr-2" />
            Generate Scenes
          </>
        )}
      </Button>
    </div>
  )
}
