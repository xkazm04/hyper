'use client'

import { User, ImageIcon, Sparkles, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Character, StoryStack } from '@/lib/types'
import { DetailSection } from '../DetailSection'
import { ImageGeneratorSection } from '../ImageGeneratorSection'
import { AvatarGeneratorSection } from '../AvatarGeneratorSection'

/**
 * 3D flip animation variants for tab content transitions.
 * The card rotates along Y-axis, scales up slightly, and casts a soft shadow.
 */
const flipVariants = {
  initial: (isEditMode: boolean) => ({
    rotateY: isEditMode ? -90 : 90,
    scale: 0.95,
    opacity: 0,
  }),
  animate: (isEditMode: boolean) => ({
    rotateY: 0,
    scale: 1,
    opacity: 1,
    boxShadow: isEditMode
      ? '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
      : '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  }),
  exit: (isEditMode: boolean) => ({
    rotateY: isEditMode ? 90 : -90,
    scale: 0.95,
    opacity: 0,
  }),
}

const flipTransition = {
  duration: 0.4,
  ease: [0.4, 0, 0.2, 1] as const, // Custom ease for smooth flip (easeInOut variant)
}

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
          <FileText className="w-4 h-4" aria-hidden="true" />
          <span className="hidden sm:inline">Detail</span>
          <span className="sr-only sm:hidden">Detail</span>
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

      {/* Tab Content with 3D Flip Animation */}
      <div className="flex-1 overflow-y-auto">
        <div
          className="max-w-3xl mx-auto p-3 sm:p-4 md:p-6"
          style={{ perspective: '1000px' }}
          data-testid="character-editor-flip-container"
        >
          <AnimatePresence mode="wait">
            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                custom={false}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={flipTransition}
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
                className="will-change-transform rounded-lg"
                data-testid="character-editor-panel-preview"
              >
                <TabsContent
                  value="preview"
                  className="mt-0"
                  tabIndex={-1}
                  forceMount
                >
                  <DetailSection
                    character={character}
                    storyStackId={storyStack.id}
                    isSaving={isSaving}
                    onUpdateCharacter={onUpdateCharacter}
                  />
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'images' && (
              <motion.div
                key="images"
                custom={true}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={flipTransition}
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
                className="will-change-transform rounded-lg"
                data-testid="character-editor-panel-images"
              >
                <TabsContent
                  value="images"
                  className="mt-0"
                  tabIndex={-1}
                  forceMount
                >
                  <ImageGeneratorSection
                    character={character}
                    storyStackId={storyStack.id}
                    isSaving={isSaving}
                    onAddImage={onAddImage}
                    onRemoveImage={onRemoveImage}
                  />
                </TabsContent>
              </motion.div>
            )}

            {activeTab === 'avatar' && (
              <motion.div
                key="avatar"
                custom={true}
                variants={flipVariants}
                initial="initial"
                animate="animate"
                exit="exit"
                transition={flipTransition}
                style={{
                  transformStyle: 'preserve-3d',
                  backfaceVisibility: 'hidden',
                }}
                className="will-change-transform rounded-lg"
                data-testid="character-editor-panel-avatar"
              >
                <TabsContent
                  value="avatar"
                  className="mt-0"
                  tabIndex={-1}
                  forceMount
                >
                  <AvatarGeneratorSection
                    character={character}
                    storyStackId={storyStack.id}
                    isSaving={isSaving}
                    onSetAvatar={onSetAvatar}
                    onRemoveAvatar={onRemoveAvatar}
                  />
                </TabsContent>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </Tabs>
  )
}
