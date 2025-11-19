'use client'

import { ReactNode, useState, cloneElement, isValidElement } from 'react'

export type ViewMode = 'default' | 'split'

interface StoryEditorLayoutProps {
  toolbar: ReactNode
  cardList: ReactNode
  cardEditor: ReactNode
  cardPreview?: ReactNode
}

export default function StoryEditorLayout({
  toolbar,
  cardList,
  cardEditor,
  cardPreview,
}: StoryEditorLayoutProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('default')

  // Clone toolbar with view mode props
  const toolbarWithProps = isValidElement(toolbar)
    ? cloneElement(toolbar as React.ReactElement<any>, {
        viewMode,
        onViewModeChange: (mode: ViewMode) => setViewMode(mode),
      })
    : toolbar

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Toolbar */}
      {toolbarWithProps}

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'default' ? (
          <>
            {/* Default View: Card List | Card Editor */}
            {/* Card List - Left Sidebar */}
            <div className="shrink-0 w-64 hidden lg:block">
              {cardList}
            </div>

            {/* Card Editor - Center Panel with tabs for Canvas/Graph */}
            <div className="flex-1 overflow-hidden">
              {cardEditor}
            </div>
          </>
        ) : (
          <>
            {/* Split View: (Card List + Card Editor) | Preview */}
            {/* Left Half - Editing Sections */}
            <div className="w-1/2 flex flex-col border-r-2 border-border overflow-hidden">
              {/* Card List - Top */}
              <div className="h-40 bg-card border-b-2 border-border overflow-y-auto shrink-0 hidden lg:block">
                {cardList}
              </div>

              {/* Card Editor - Bottom */}
              <div className="flex-1 overflow-hidden">
                {cardEditor}
              </div>
            </div>

            {/* Right Half - Live Preview */}
            <div className="w-1/2 bg-muted overflow-auto">
              {cardPreview || (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center p-8">
                    <p className="text-lg font-semibold mb-2">Live Preview</p>
                    <p className="text-sm">Your card preview will appear here as you edit</p>
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
