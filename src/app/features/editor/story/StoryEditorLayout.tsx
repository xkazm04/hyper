'use client'

import { ReactNode, useState } from 'react'
import { cn } from '@/lib/utils'
import { FileText, Users, Palette } from 'lucide-react'
import { ArtStyleEditor } from './sub_Story/components/ArtStyleEditor'

interface StoryEditorLayoutProps {
  toolbar: ReactNode
  cardList: ReactNode
  characterList: ReactNode
  cardEditor: ReactNode
  characterEditor: ReactNode
  cardPreview?: ReactNode
}

type EditorTab = 'story' | 'cards' | 'characters'

export default function StoryEditorLayout({
  toolbar,
  cardList,
  characterList,
  cardEditor,
  characterEditor,
}: StoryEditorLayoutProps) {
  const [activeEditorTab, setActiveEditorTab] = useState<EditorTab>('cards')

  const tabs: { id: EditorTab; label: string; icon: React.ReactNode }[] = [
    { id: 'story', label: 'Story', icon: <Palette className="w-4 h-4" /> },
    { id: 'cards', label: 'Cards', icon: <FileText className="w-4 h-4" /> },
    { id: 'characters', label: 'Characters', icon: <Users className="w-4 h-4" /> },
  ]

  return (
    <div className="h-screen flex flex-col bg-background halloween-vignette">
      {/* Toolbar */}
      {toolbar}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
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

        {/* Main Editor - Center Panel with tabs for Story/Cards/Characters */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {/* Tab Switcher - Story / Cards / Characters */}
          <div className="shrink-0 border-b-2 border-border bg-muted/30">
            <div className="flex">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveEditorTab(tab.id)}
                  className={cn(
                    'relative flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all duration-200',
                    activeEditorTab === tab.id
                      ? 'text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  )}
                  data-testid={`${tab.id}-tab-btn`}
                >
                  {/* Active tab background */}
                  {activeEditorTab === tab.id && (
                    <span className="absolute inset-1 bg-primary rounded-md shadow-sm" />
                  )}
                  <span className="relative flex items-center gap-2">
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
