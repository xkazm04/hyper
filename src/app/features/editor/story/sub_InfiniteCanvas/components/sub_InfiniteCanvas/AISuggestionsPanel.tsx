'use client'

import { cn } from '@/lib/utils'
import { Sparkles, RefreshCw, AlertCircle, Wand2, XCircle } from 'lucide-react'
import { SuggestedCard } from '@/lib/types/ai-canvas'

interface AISuggestionsPanelProps {
  suggestions: SuggestedCard[]
  isGenerating: boolean
  error: string | null
  currentCardId: string | null
  storyCardsLength: number
  onGenerateSuggestions: (sourceCardId?: string) => void
  onDismissAllSuggestions: () => void
}

export function AISuggestionsPanel({
  suggestions, isGenerating, error, currentCardId, storyCardsLength,
  onGenerateSuggestions, onDismissAllSuggestions,
}: AISuggestionsPanelProps) {
  return (
    <div className="bg-card/95 border-2 border-border rounded-lg p-3 shadow-lg backdrop-blur-sm w-full">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        <Sparkles className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">AI Co-Creator</h3>
        {isGenerating && <RefreshCw className="w-3 h-3 text-muted-foreground animate-spin ml-auto" />}
      </div>

      <div className="space-y-2">
        {error && (
          <div className="flex items-center gap-2 text-xs text-destructive">
            <AlertCircle className="w-3 h-3" />
            <span>{error}</span>
          </div>
        )}

        {suggestions.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{suggestions.length}</span> suggestions ready
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => onGenerateSuggestions(currentCardId || undefined)}
                disabled={isGenerating}
                className={cn(
                  'flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium',
                  'bg-primary/10 text-primary hover:bg-primary/20',
                  'rounded border border-primary/30 transition-colors',
                  'disabled:opacity-50 disabled:cursor-not-allowed'
                )}
                data-testid="refresh-suggestions-btn"
              >
                <RefreshCw className="w-3 h-3" />
                Refresh
              </button>
              <button
                onClick={onDismissAllSuggestions}
                className={cn(
                  'flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium',
                  'bg-muted text-muted-foreground hover:bg-muted/80',
                  'rounded border border-border transition-colors'
                )}
                data-testid="dismiss-suggestions-btn"
              >
                <XCircle className="w-3 h-3" />
              </button>
            </div>
          </>
        ) : (
          <EmptyState
            isGenerating={isGenerating}
            storyCardsLength={storyCardsLength}
            currentCardId={currentCardId}
            onGenerateSuggestions={onGenerateSuggestions}
          />
        )}

        {suggestions.length > 0 && <ConfidenceLegend />}
      </div>
    </div>
  )
}

function EmptyState({ isGenerating, storyCardsLength, currentCardId, onGenerateSuggestions }: {
  isGenerating: boolean; storyCardsLength: number; currentCardId: string | null
  onGenerateSuggestions: (sourceCardId?: string) => void
}) {
  return (
    <div className="text-center py-2">
      <Wand2 className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
      <p className="text-xs text-muted-foreground mb-2">
        {isGenerating ? 'Thinking ahead...' : storyCardsLength === 0 ? 'Create a card to get AI suggestions' : 'Ready to suggest next steps'}
      </p>
      {storyCardsLength > 0 && !isGenerating && (
        <button
          onClick={() => onGenerateSuggestions(currentCardId || undefined)}
          className={cn(
            'flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'rounded transition-colors mx-auto'
          )}
          data-testid="generate-suggestions-btn"
        >
          <Sparkles className="w-3 h-3" />
          Generate Ideas
        </button>
      )}
    </div>
  )
}

function ConfidenceLegend() {
  return (
    <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-2 border-t border-border/50">
      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" />High</span>
      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" />Medium</span>
      <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-400" />Low</span>
    </div>
  )
}
