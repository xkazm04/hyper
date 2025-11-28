'use client'

import { User, ImageIcon, Sparkles, Eye } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Character, StoryStack } from '@/lib/types'
import { PreviewSection } from '../PreviewSection'
import { ImageGeneratorSection } from '../ImageGeneratorSection'
import { AvatarGeneratorSection } from '../AvatarGeneratorSection'

interface CharacterFormProps {
  character: Character
  storyStack: StoryStack
  activeTab: string
  isSaving: boolean
  onTabChange: (tab: string) => void
  onUpdateCharacter: (updates: Partial<Character>) => Promise<void>
  onAddImage: (imageUrl: string, prompt: string) => Promise<void>
  onRemoveImage: (index: number) => Promise<void>
  onSetAvatar: (avatarUrl: string, prompt: string) => Promise<void>
  onRemoveAvatar: () => Promise<void>
}

export function CharacterForm({
  character,
  storyStack,
  activeTab,
  isSaving,
  onTabChange,
  onUpdateCharacter,
  onAddImage,
  onRemoveImage,
  onSetAvatar,
  onRemoveAvatar,
}: CharacterFormProps) {
  return (
    <Tabs
      value={activeTab}
      onValueChange={onTabChange}
      className="flex-1 flex flex-col overflow-hidden"
      data-testid="character-editor-tabs"
    >
      <TabsList
        className="flex-shrink-0 w-full max-w-3xl mx-auto p-3 sm:p-4 bg-transparent justify-start gap-2"
        aria-label="Character editor tabs"
      >
        <TabsTrigger
          value="preview"
          className="flex items-center gap-2 px-4 data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          data-testid="character-editor-tab-preview"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Preview</span>
          <span className="sr-only sm:hidden">Preview</span>
        </TabsTrigger>
        <TabsTrigger
          value="images"
          className="flex items-center gap-2 px-4 data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          data-testid="character-editor-tab-images"
        >
          <ImageIcon className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Image Generator</span>
          <span className="sr-only sm:hidden">Image Generator</span>
        </TabsTrigger>
        <TabsTrigger
          value="avatar"
          className="flex items-center gap-2 px-4 data-[state=active]:shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          data-testid="character-editor-tab-avatar"
        >
          <Sparkles className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Avatar Generator</span>
          <span className="sr-only sm:hidden">Avatar Generator</span>
        </TabsTrigger>
      </TabsList>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-3 sm:p-4 md:p-6">
          <TabsContent
            value="preview"
            className="mt-0"
            tabIndex={-1}
            data-testid="character-editor-panel-preview"
          >
            <PreviewSection
              character={character}
              storyStackId={storyStack.id}
              isSaving={isSaving}
              onUpdateCharacter={onUpdateCharacter}
            />
          </TabsContent>

          <TabsContent
            value="images"
            className="mt-0"
            tabIndex={-1}
            data-testid="character-editor-panel-images"
          >
            <ImageGeneratorSection
              character={character}
              storyStackId={storyStack.id}
              isSaving={isSaving}
              onAddImage={onAddImage}
              onRemoveImage={onRemoveImage}
            />
          </TabsContent>

          <TabsContent
            value="avatar"
            className="mt-0"
            tabIndex={-1}
            data-testid="character-editor-panel-avatar"
          >
            <AvatarGeneratorSection
              character={character}
              storyStackId={storyStack.id}
              isSaving={isSaving}
              onSetAvatar={onSetAvatar}
              onRemoveAvatar={onRemoveAvatar}
            />
          </TabsContent>
        </div>
      </div>
    </Tabs>
  )
}
