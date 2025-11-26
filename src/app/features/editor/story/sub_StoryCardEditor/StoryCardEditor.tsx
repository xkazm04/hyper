'use client'

import { useState } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import {
  SectionTabs,
  ViewToggle,
  ContentSection,
  ImageSection,
  ScriptSection,
  ChoicesSection,
  EmptyState,
  type CardSection,
  type ViewMode,
  type SplitMode,
} from './components'
import StoryGraph from '../sub_StoryGraph/StoryGraph'

interface StoryCardEditorProps {
  splitMode?: SplitMode
  onSplitModeChange?: (mode: SplitMode) => void
}

export default function StoryCardEditor({
  splitMode = 'default',
  onSplitModeChange,
}: StoryCardEditorProps) {
  const { currentCard, storyStack, storyCards, choices } = useEditor()

  const [viewMode, setViewMode] = useState<ViewMode>('canvas')
  const [activeSection, setActiveSection] = useState<CardSection>('content')

  // Early returns for loading/empty states
  if (!storyStack) {
    return null
  }

  if (!currentCard) {
    return <EmptyState />
  }

  // Get choice count for current card
  const cardChoices = choices.filter(c => c.storyCardId === currentCard.id)

  return (
    <div className="h-full flex flex-col bg-muted/30">
      {/* View Toggle Header */}
      <div className="shrink-0 border-b-2 border-border bg-card px-4 py-3">
        <ViewToggle
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          splitMode={splitMode}
          onSplitModeChange={onSplitModeChange}
        />
      </div>

      {/* Section Tabs - Only visible in canvas mode */}
      {viewMode === 'canvas' && (
        <SectionTabs
          activeSection={activeSection}
          onSectionChange={setActiveSection}
          hasImage={!!currentCard.imageUrl}
          hasScript={!!currentCard.script && currentCard.script.trim().length > 0}
          choiceCount={cardChoices.length}
        />
      )}

      {/* Main Content Area */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'graph' ? (
          <StoryGraph />
        ) : (
          <div className="h-full overflow-y-auto">
            <div className="max-w-3xl mx-auto p-4 sm:p-6">
              {/* Vintage card frame wrapper */}
              <div className="bg-card rounded-lg border-2 border-border p-4 sm:p-6
                              shadow-[4px_4px_0px_0px_hsl(var(--border))]">
                {/* Section Content */}
                {activeSection === 'content' && (
                  <ContentSection
                    cardId={currentCard.id}
                    storyStackId={storyStack.id}
                    initialTitle={currentCard.title || ''}
                    initialContent={currentCard.content || ''}
                  />
                )}

                {activeSection === 'image' && (
                  <ImageSection
                    cardId={currentCard.id}
                    storyStackId={storyStack.id}
                    imageUrl={currentCard.imageUrl}
                    imagePrompt={currentCard.imagePrompt}
                    cardContent={currentCard.content}
                  />
                )}

                {activeSection === 'script' && (
                  <ScriptSection
                    cardId={currentCard.id}
                    storyStackId={storyStack.id}
                    initialScript={currentCard.script || ''}
                  />
                )}

                {activeSection === 'choices' && (
                  <ChoicesSection
                    cardId={currentCard.id}
                    storyStackId={storyStack.id}
                    availableCards={storyCards}
                    currentCard={currentCard}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
