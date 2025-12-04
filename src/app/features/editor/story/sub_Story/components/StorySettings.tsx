'use client'

import { useState } from 'react'
import { StoryTabToggle, StoryTabMode } from './StoryTabToggle'
import { DescriptionTab } from './DescriptionTab'
import { ArtStyleEditor } from './ArtStyleEditor'

interface StorySettingsProps {
  onSave?: () => void
}

export function StorySettings({ onSave }: StorySettingsProps) {
  const [activeTab, setActiveTab] = useState<StoryTabMode>('description')

  return (
    <div className="space-y-6">
      {/* Tab Toggle */}
      <StoryTabToggle
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'description' ? (
          <DescriptionTab />
        ) : (
          <ArtStyleEditor onSave={onSave} />
        )}
      </div>
    </div>
  )
}
