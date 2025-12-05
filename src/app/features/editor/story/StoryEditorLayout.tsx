'use client'

import { ReactNode, useCallback, useRef, useEffect } from 'react'
import { FileText, Users, Palette } from 'lucide-react'
import { StorySettings } from './sub_Story'
import { TabSwitcher, TabItem } from '@/components/ui/TabSwitcher'
import {
  useSidebarNavigationStore,
  selectActiveTab,
  selectSetActiveTab,
  type EditorTab,
} from './lib/sidebarNavigationStore'

// Callback type for switching to graph view inside the card editor
export type SwitchToGraphFn = () => void

interface StoryEditorLayoutProps {
  toolbar: ReactNode
  cardList: ReactNode | ((props: { onOpenStoryGraph: () => void }) => ReactNode)
  characterList: ReactNode | ((props: { onSwitchToCharacters: () => void }) => ReactNode)
  cardEditor: ReactNode | ((props: { registerSwitchToGraph: (fn: SwitchToGraphFn) => void }) => ReactNode)
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
  // Use Zustand store for tab state (shared with sidebars)
  const activeEditorTab = useSidebarNavigationStore(selectActiveTab)
  const setActiveEditorTab = useSidebarNavigationStore(selectSetActiveTab)

  // Store reference to the cardEditor's switchToGraph function
  const switchToGraphRef = useRef<SwitchToGraphFn | null>(null)

  const switchToCharactersTab = useCallback(() => {
    setActiveEditorTab('characters')
  }, [setActiveEditorTab])

  // Called by cardEditor to register its switchToGraph function
  const registerSwitchToGraph = useCallback((fn: SwitchToGraphFn) => {
    switchToGraphRef.current = fn
  }, [])

  // Called by cardList when user clicks "Open Story Graph"
  const handleOpenStoryGraph = useCallback(() => {
    // First switch to cards tab if not there
    setActiveEditorTab('cards')
    // Then trigger the graph view switch inside cardEditor
    // Use setTimeout to ensure tab switch completes first
    setTimeout(() => {
      switchToGraphRef.current?.()
    }, 0)
  }, [setActiveEditorTab])

  const tabs: TabItem<EditorTab>[] = [
    { id: 'story', label: 'Story', icon: <Palette className="w-4 h-4" /> },
    { id: 'cards', label: 'Cards', icon: <FileText className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" /> },
  ]

  // Render card list - supports both ReactNode and render prop patterns
  const renderCardList = () => {
    if (typeof cardList === 'function') {
      return cardList({ onOpenStoryGraph: handleOpenStoryGraph })
    }
    return cardList
  }

  // Render character list - supports both ReactNode and render prop patterns
  const renderCharacterList = () => {
    if (typeof characterList === 'function') {
      return characterList({ onSwitchToCharacters: switchToCharactersTab })
    }
    return characterList
  }

  // Render card editor - supports both ReactNode and render prop patterns
  const renderCardEditor = () => {
    if (typeof cardEditor === 'function') {
      return cardEditor({ registerSwitchToGraph })
    }
    return cardEditor
  }

  return (
    <div className="h-screen flex flex-col bg-background halloween-vignette">
      {/* Toolbar */}
      {toolbar}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Cards, Characters, and History */}
        <div className="shrink-0 w-[20%] hidden lg:flex lg:flex-col border-r-2 border-border">
          {/* Cards List - Top */}
          <div className="flex-2 border-b border-border overflow-hidden min-h-0">
            {renderCardList()}
          </div>

          {/* Characters List - Middle */}
          <div className="flex-1 border-b border-border overflow-hidden min-h-0">
            {renderCharacterList()}
          </div>

          {/* History Panel - Bottom */}
          {/* <div className="shrink-0 max-h-80 overflow-hidden">
            <HistoryPanel
              collapsible
              defaultCollapsed={false}
              maxVisibleEntries={15}
              className="rounded-none border-0 shadow-none"
            />
          </div> */}
        </div>

        {/* Main Editor - Center Panel with tabs for Story/Cards/Characters */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Switcher - Story / Cards / Characters */}
          <div className="shrink-0">
            <TabSwitcher
              tabs={tabs}
              activeTab={activeEditorTab}
              onTabChange={setActiveEditorTab}
              variant="default"
              size="md"
            />
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-hidden">
            {activeEditorTab === 'story' && (
              <div className="h-full overflow-y-auto p-4 sm:p-6">
                <div className="max-w-2xl mx-auto">
                  <StorySettings />
                </div>
              </div>
            )}
            {activeEditorTab === 'cards' && renderCardEditor()}
            {activeEditorTab === 'characters' && characterEditor}
          </div>
        </div>
      </div>
    </div>
  )
}

// Re-export EditorTab type for external use
export type { EditorTab }
