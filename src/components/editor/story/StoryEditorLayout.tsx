'use client'

import { ReactNode, useState } from 'react'
import { Button } from '@/components/ui/button'
import { List, FileEdit, Network } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StoryEditorLayoutProps {
  toolbar: ReactNode
  cardList: ReactNode
  cardEditor: ReactNode
  storyGraph: ReactNode
}

type MobileView = 'cards' | 'editor' | 'graph'

export default function StoryEditorLayout({
  toolbar,
  cardList,
  cardEditor,
  storyGraph,
}: StoryEditorLayoutProps) {
  const [mobileView, setMobileView] = useState<MobileView>('editor')

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      {toolbar}

      {/* Mobile Navigation Tabs - Only visible on mobile */}
      <div className="lg:hidden border-b-2 border-black bg-white">
        <div className="flex">
          <button
            onClick={() => setMobileView('cards')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-gray-200',
              mobileView === 'cards'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <List className="w-4 h-4" />
            <span>Cards</span>
          </button>
          <button
            onClick={() => setMobileView('editor')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors border-r border-gray-200',
              mobileView === 'editor'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <FileEdit className="w-4 h-4" />
            <span>Editor</span>
          </button>
          <button
            onClick={() => setMobileView('graph')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
              mobileView === 'graph'
                ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-500'
                : 'text-gray-600 hover:bg-gray-50'
            )}
          >
            <Network className="w-4 h-4" />
            <span>Graph</span>
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Card List - Left Sidebar (Desktop: 256px, Mobile: full width when active) */}
        <div className={cn(
          'shrink-0 lg:w-64',
          mobileView === 'cards' ? 'w-full' : 'hidden lg:block'
        )}>
          {cardList}
        </div>

        {/* Card Editor - Center Panel (Desktop: flexible, Mobile: full width when active) */}
        <div className={cn(
          'overflow-auto lg:flex-1',
          mobileView === 'editor' ? 'flex-1' : 'hidden lg:block'
        )}>
          {cardEditor}
        </div>

        {/* Story Graph - Right Sidebar (Desktop: 320px, Mobile: full width when active) */}
        <div className={cn(
          'shrink-0 lg:w-80',
          mobileView === 'graph' ? 'w-full' : 'hidden lg:block'
        )}>
          {storyGraph}
        </div>
      </div>
    </div>
  )
}
