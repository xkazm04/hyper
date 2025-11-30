'use client'

import { useState, useCallback, lazy, Suspense } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { ViewToggle, type ViewMode } from './components/ViewToggle'
import { EmptyState } from './components/EmptyState'
import { SectionLoadingFallback } from './components/SectionLoadingFallback'
import StoryGraph from '../sub_StoryGraph/StoryGraph'
import CardPreview from '../CardPreview'
import { PathAnalyzer } from '../sub_PathAnalyzer'
import { AICompanionBottomPanel } from '../sub_AICompanion/AICompanionBottomPanel'

// Lazy load section components for reduced initial bundle size
const ContentSection = lazy(() =>
  import('./components/ContentSection').then(mod => ({ default: mod.ContentSection }))
)

export default function StoryCardEditor() {
  const { currentCard, storyStack, storyCards, setCurrentCardId } = useEditor()

  const [viewMode, setViewMode] = useState<ViewMode>('content')

  // Handle card click from analytics - navigate to card and switch to content
  const handleAnalyticsCardClick = useCallback((cardId: string) => {
    setCurrentCardId(cardId)
    setViewMode('content')
  }, [setCurrentCardId])

  // Early returns for loading/empty states
  if (!storyStack) {
    return null
  }

  // For analytics view, we don't need a current card
  if (!currentCard && viewMode !== 'analytics' && viewMode !== 'graph') {
    return <EmptyState />
  }

  // Show AI companion for content and graph views
  const showAICompanion = viewMode === 'content' || viewMode === 'graph'

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* View Toggle Header */}
      <div className="shrink-0 border-b-2 border-border bg-card px-4 py-3">
        <ViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          hasImage={!!currentCard?.imageUrl}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden relative">
        {viewMode === 'graph' ? (
          <StoryGraph />
        ) : viewMode === 'preview' ? (
          <CardPreview />
        ) : viewMode === 'analytics' ? (
          <div className="h-full overflow-y-auto p-4 sm:p-6">
            <div className="max-w-4xl mx-auto">
              <PathAnalyzer onCardClick={handleAnalyticsCardClick} />
            </div>
          </div>
        ) : currentCard ? (
          <div className="h-full overflow-y-auto pb-20">
            <div className="max-w-7xl mx-auto p-4 sm:p-6">
              {/* Card editing area with side-by-side content + image */}
              <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6
                              shadow-[4px_4px_0px_0px_hsl(var(--border))]">
                {/* Content Section with integrated Image panel - Lazy loaded */}
                {viewMode === 'content' && (
                  <Suspense fallback={<SectionLoadingFallback section="content" />}>
                    <ContentSection
                      cardId={currentCard.id}
                      storyStackId={storyStack.id}
                      initialTitle={currentCard.title || ''}
                      initialContent={currentCard.content || ''}
                      initialMessage={currentCard.message}
                      initialSpeaker={currentCard.speaker}
                      availableCards={storyCards}
                      currentCard={currentCard}
                    />
                  </Suspense>
                )}
              </div>
            </div>
          </div>
        ) : null}

        {/* AI Companion Bottom Panel - Available for content and graph views */}
        {showAICompanion && (
          <div className="absolute bottom-0 left-0 right-0 z-20">
            <AICompanionBottomPanel />
          </div>
        )}
      </div>
    </div>
  )
}
