'use client'

import { useState, useCallback, useEffect, lazy, Suspense } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { ViewToggle, type ViewMode } from './components/ViewToggle'
import { EmptyState } from './components/EmptyState'
import { SectionLoadingFallback } from './components/SectionLoadingFallback'
import { AICompanionBottomPanel } from '../sub_AICompanion/AICompanionBottomPanel'
import type { SwitchToGraphFn } from '../StoryEditorLayout'

// Lazy load section components for reduced initial bundle size
const ContentSection = lazy(() =>
  import('./components/ContentSection').then(mod => ({ default: mod.ContentSection }))
)

// Lazy load view panels - these pull in heavy libraries (React Flow, D3, etc.)
// and are only needed when their respective tabs are selected
const StoryGraph = lazy(() => import('../sub_StoryGraph/StoryGraph'))
const CardPreview = lazy(() => import('../CardPreview'))

interface StoryCardEditorProps {
  registerSwitchToGraph?: (fn: SwitchToGraphFn) => void
}

export default function StoryCardEditor({ registerSwitchToGraph }: StoryCardEditorProps) {
  const { currentCard, storyStack, storyCards, setCurrentCardId } = useEditor()

  const [viewMode, setViewMode] = useState<ViewMode>('content')

  // Expose the switchToGraph function to parent via register callback
  const switchToGraph = useCallback(() => {
    setViewMode('graph')
  }, [])

  useEffect(() => {
    if (registerSwitchToGraph) {
      registerSwitchToGraph(switchToGraph)
    }
  }, [registerSwitchToGraph, switchToGraph])


  // Early returns for loading/empty states
  if (!storyStack) {
    return null
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
      <div className="flex-1 pb-[100px] overflow-hidden relative">
        {viewMode === 'graph' ? (
          <Suspense fallback={<SectionLoadingFallback section="graph" fullHeight />}>
            <StoryGraph />
          </Suspense>
        ) : viewMode === 'preview' ? (
          <Suspense fallback={<SectionLoadingFallback section="preview" fullHeight />}>
            <CardPreview />
          </Suspense>
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
