'use client'

import { ReactNode, useState, cloneElement, isValidElement } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Users } from 'lucide-react'

export type SplitMode = 'default' | 'split'

interface StoryEditorLayoutProps {
  toolbar: ReactNode
  cardList: ReactNode
  characterList: ReactNode
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
  cardPreview,
}: StoryEditorLayoutProps) {
  const [splitMode, setSplitMode] = useState<SplitMode>('default')
  const [activeEditorTab, setActiveEditorTab] = useState<'cards' | 'characters'>('cards')

  // Clone card editor with split mode props (split view toggle is now in CardEditor)
  const cardEditorWithProps = isValidElement(cardEditor)
    ? cloneElement(cardEditor as React.ReactElement<any>, {
        splitMode,
        onSplitModeChange: (mode: SplitMode) => setSplitMode(mode),
      })
    : cardEditor

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      {toolbar}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {splitMode === 'default' ? (
          <>
            {/* Default View: Split Sidebar (Cards + Characters) | Editor */}
            {/* Left Sidebar - Split between Cards and Characters */}
            <div className="shrink-0 w-64 hidden lg:flex lg:flex-col border-r-2 border-border">
              {/* Cards List - Top Half */}
              <div className="flex-1 border-b border-border overflow-hidden">
                {cardList}
              </div>

              {/* Characters List - Bottom Half */}
              <div className="flex-1 overflow-hidden">
                {characterList}
              </div>
            </div>

            {/* Main Editor - Center Panel with tabs for Cards/Characters */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {/* Tab Switcher - Cards / Characters */}
              <div className="shrink-0 border-b-2 border-border bg-card">
                <div className="flex">
                  <button
                    onClick={() => setActiveEditorTab('cards')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200',
                      'border-b-2 -mb-px',
                      activeEditorTab === 'cards'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    data-testid="cards-tab-btn"
                  >
                    <FileText className="w-4 h-4" />
                    Cards
                  </button>
                  <button
                    onClick={() => setActiveEditorTab('characters')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200',
                      'border-b-2 -mb-px',
                      activeEditorTab === 'characters'
                        ? 'border-primary text-primary bg-primary/5'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    data-testid="characters-tab-btn"
                  >
                    <Users className="w-4 h-4" />
                    Characters
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-hidden">
                {activeEditorTab === 'cards' ? cardEditorWithProps : characterEditor}
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Split View: (Split Sidebar + Editor) | Preview */}
            {/* Left Half - Editing Sections */}
            <div className="w-1/2 flex border-r-2 border-border overflow-hidden">
              {/* Split Sidebar */}
              <div className="shrink-0 w-48 hidden lg:flex lg:flex-col border-r border-border">
                {/* Cards List - Top Half */}
                <div className="flex-1 border-b border-border overflow-hidden">
                  {cardList}
                </div>

                {/* Characters List - Bottom Half */}
                <div className="flex-1 overflow-hidden">
                  {characterList}
                </div>
              </div>

              {/* Editor */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Tab Switcher */}
                <div className="shrink-0 border-b-2 border-border bg-card">
                  <div className="flex">
                    <button
                      onClick={() => setActiveEditorTab('cards')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200',
                        'border-b-2 -mb-px',
                        activeEditorTab === 'cards'
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      data-testid="cards-tab-btn-split"
                    >
                      <FileText className="w-4 h-4" />
                      Cards
                    </button>
                    <button
                      onClick={() => setActiveEditorTab('characters')}
                      className={cn(
                        'flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200',
                        'border-b-2 -mb-px',
                        activeEditorTab === 'characters'
                          ? 'border-primary text-primary bg-primary/5'
                          : 'border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      )}
                      data-testid="characters-tab-btn-split"
                    >
                      <Users className="w-4 h-4" />
                      Characters
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="flex-1 overflow-hidden">
                  {activeEditorTab === 'cards' ? cardEditorWithProps : characterEditor}
                </div>
              </div>
            </div>

            {/* Right Half - Live Preview */}
            <div className="w-1/2 bg-muted/30 overflow-auto">
              {cardPreview || (
                <div className="h-full flex items-center justify-center">
                  <div className="text-center p-8 max-w-sm">
                    {/* Preview placeholder with vintage style */}
                    <div className="w-20 h-24 mx-auto mb-4 relative">
                      <div className="absolute inset-0 bg-card border-2 border-border rounded-lg
                                      transform rotate-3 shadow-[2px_2px_0px_0px_hsl(var(--border))]" />
                      <div className="absolute inset-0 bg-card border-2 border-border rounded-lg
                                      shadow-[3px_3px_0px_0px_hsl(var(--border))]" />
                    </div>
                    <p className="text-lg font-semibold text-foreground mb-2">Live Preview</p>
                    <p className="text-sm text-muted-foreground">
                      Your card preview will appear here as you edit
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
