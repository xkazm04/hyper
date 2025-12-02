'use client'

import { ReactNode, useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Users, Palette } from 'lucide-react'
import { ArtStyleEditor } from './sub_Story/components/ArtStyleEditor'
import { HistoryPanel } from '../undo-redo'

export type EditorTab = 'story' | 'cards' | 'characters'

interface StoryEditorLayoutProps {
  toolbar: ReactNode
  cardList: ReactNode
  characterList: ReactNode | ((props: { onSwitchToCharacters: () => void }) => ReactNode)
  cardEditor: ReactNode
  characterEditor: ReactNode
  cardPreview?: ReactNode
}

export default function StoryEditorLayout({
  toolbar,
  cardList,
  characterList,
  cardEditor,
  characterEditor,
}: StoryEditorLayoutProps) {
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('cards')

  const switchToCharactersTab = useCallback(() => {
    setActiveEditorTab('characters')
  }, [])

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'story', label: 'Story', icon: <Palette className="w-4 h-4" /> },
    { id: 'cards', label: 'Cards', icon: <FileText className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" /> },
  ]

  // Render character list - supports both ReactNode and render prop patterns
  const renderCharacterList = () => {
    if (typeof characterList === 'function') {
      return characterList({ onSwitchToCharacters: switchToCharactersTab })
    }
    return characterList
  }

  return (
    <div className="h-screen flex flex-col bg-background halloween-vignette">
      {/* Toolbar */}
      {toolbar}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Cards, Characters, and History */}
        <div className="shrink-0 w-64 hidden lg:flex lg:flex-col border-r-2 border-border">
          {/* Cards List - Top */}
          <div className="flex-1 border-b border-border overflow-hidden min-h-0">
            {cardList}
          </div>

          {/* Characters List - Middle */}
          <div className="flex-1 border-b border-border overflow-hidden min-h-0">
            {renderCharacterList()}
          </div>

          {/* History Panel - Bottom */}
          <div className="shrink-0 max-h-80 overflow-hidden">
            <HistoryPanel
              collapsible
              defaultCollapsed={false}
              maxVisibleEntries={15}
              className="rounded-none border-0 shadow-none"
            />
          </div>
        </div>

        {/* Main Editor - Center Panel with tabs for Story/Cards/Characters */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Switcher - Story / Cards / Characters */}
          <div className="shrink-0 border-b-2 border-border bg-card">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditorTab(tab.id)}
                  className={cn(
                    'relative flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200 border-b-2 -mb-[2px]',
                    activeEditorTab === tab.id
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-transparent text-muted-foreground border-transparent hover:text-foreground hover:bg-muted/50'
                  )}
                  data-testid={`${tab.id}-tab-btn`}
                >
                  <span className="flex items-center gap-2">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeEditorTab === 'story' && (
              <div className="h-full overflow-y-auto p-4 sm:p-6">
                <div className="max-w-2xl mx-auto">
                  <ArtStyleEditor />
                </div>
              </div>
            )}
            {activeEditorTab === 'cards' && cardEditor}
            {activeEditorTab === 'characters' && characterEditor}
          </div>
        </div>
      </div>
    </div>
  )
}
