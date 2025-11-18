'use client'

import { useState, cloneElement, isValidElement } from 'react'

interface EditorLayoutProps {
  toolbar: React.ReactNode
  canvas: React.ReactNode
  navigator: React.ReactNode
  properties: React.ReactNode
  versionHistory?: React.ReactNode
  deploymentHistory?: React.ReactNode
}

export default function EditorLayout({
  toolbar,
  canvas,
  navigator,
  properties,
  versionHistory,
  deploymentHistory,
}: EditorLayoutProps) {
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [showDeploymentHistory, setShowDeploymentHistory] = useState(false)

  // Clone toolbar with version history and deployment history props
  const toolbarWithProps = isValidElement(toolbar)
    ? cloneElement(toolbar as React.ReactElement<any>, {
        onToggleVersionHistory: () => setShowVersionHistory(prev => !prev),
        showVersionHistory,
        onToggleDeploymentHistory: () => setShowDeploymentHistory(prev => !prev),
        showDeploymentHistory,
      })
    : toolbar

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Toolbar */}
      <div className="h-16 bg-white border-b-2 border-black">
        {toolbarWithProps}
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex overflow-hidden">
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
