'use client'

import { useState, cloneElement, isValidElement } from 'react'

export type ViewMode = 'default' | 'split'

interface EditorLayoutProps {
  toolbar: React.ReactNode
  canvas: React.ReactNode
  navigator: React.ReactNode
  properties: React.ReactNode
  versionHistory?: React.ReactNode
  deploymentHistory?: React.ReactNode
  preview?: React.ReactNode
}

export default function EditorLayout({
  toolbar,
  canvas,
  navigator,
  properties,
  versionHistory,
  deploymentHistory,
  preview,
}: EditorLayoutProps) {
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showDeploymentHistory, setShowDeploymentHistory] = useState(false)
  const [viewMode, setViewMode] = useState<ViewMode>('default')

  // Clone toolbar with version history, deployment history, and view mode props
  const toolbarWithProps = isValidElement(toolbar)
    ? cloneElement(toolbar as React.ReactElement<any>, {
        onToggleVersionHistory: () => setShowVersionHistory(prev => !prev),
        showVersionHistory,
        onToggleDeploymentHistory: () => setShowDeploymentHistory(prev => !prev),
        showDeploymentHistory,
        viewMode,
        onViewModeChange: (mode: ViewMode) => setViewMode(mode),
      })
    : toolbar

  return (
    <div className="h-screen flex flex-col bg-gray-100 halloween-vignette">
      {/* Toolbar */}
      <div className="h-16 bg-white border-b-2 border-black">
        {toolbarWithProps}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'default' ? (
          <>
            {/* Default View: Navigator | Canvas | Properties */}
            {/* Card Navigator - Left Sidebar */}
            <div className="w-64 bg-white border-r-2 border-black overflow-y-auto">
              {navigator}
            </div>

            {/* Canvas - Center */}
            <div className="flex-1 bg-gray-100 overflow-auto p-8">
              {canvas}
            </div>

            {/* Property Panel - Right Sidebar */}
            <div className="w-80 bg-white border-l-2 border-black overflow-y-auto">
              {properties}
            </div>
          </>
        ) : (
          <>
            {/* Split View: Editing (Navigator + Properties + Canvas) | Preview */}
            {/* Left Half - Editing Sections */}
            <div className="w-1/2 flex flex-col border-r-2 border-black overflow-hidden">
              {/* Card Navigator - Top */}
              <div className="h-48 bg-white border-b-2 border-black overflow-y-auto shrink-0">
                {navigator}
              </div>

              {/* Properties/Canvas - Bottom (scrollable editing area) */}
              <div className="flex-1 flex overflow-hidden">
                <div className="flex-1 bg-gray-100 overflow-auto p-4">
                  {canvas}
                </div>
                <div className="w-80 bg-white border-l-2 border-black overflow-y-auto">
                  {properties}
                </div>
              </div>
            </div>

            {/* Right Half - Preview */}
            <div className="w-1/2 bg-gray-50 overflow-auto">
              {preview || (
                <div className="h-full flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <p className="text-lg font-semibold">Preview</p>
                    <p className="text-sm">Card preview will appear here</p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* Version History Panel - Collapsible Right Sidebar */}
        {versionHistory && showVersionHistory && (
          <div className="w-96 bg-white border-l-2 border-black overflow-y-auto">
            {versionHistory}
          </div>
        )}

        {/* Deployment History Panel - Collapsible Right Sidebar */}
        {deploymentHistory && showDeploymentHistory && (
          <div className="w-96 bg-white border-l-2 border-black overflow-y-auto">
            {deploymentHistory}
          </div>
        )}
      </div>
    </div>
  )
}
