'use client'

import { ImageIcon, Sparkles, FileText } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { TabSwitcher, TabItem } from '@/components/ui/TabSwitcher'
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

type CharacterTab = 'preview' | 'images' | 'avatar'

const characterTabs: TabItem<CharacterTab>[] = [
  { id: 'preview', label: 'Detail', icon: <FileText className="w-4 h-4" /> },
  { id: 'images', label: 'Image Generator', icon: <ImageIcon className="w-4 h-4" /> },
  { id: 'avatar', label: 'Avatar Generator', icon: <Sparkles className="w-4 h-4" /> },
]

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
    <div
      className="flex-1 flex flex-col overflow-hidden"
      data-testid="character-editor-tabs"
    >
      {/* Tab Switcher */}
      <div className="flex-shrink-0 w-full max-w-3xl mx-auto px-3 sm:px-4 pt-3 sm:pt-4">
        <TabSwitcher
          tabs={characterTabs}
          activeTab={activeTab as CharacterTab}
          onTabChange={(tab) => onTabChange(tab)}
          variant="pills"
          size="sm"
          fullWidth={false}
        />
      </div>

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
                <DetailSection
                  character={character}
                  storyStackId={storyStack.id}
                  isSaving={isSaving}
                  onUpdateCharacter={onUpdateCharacter}
                />
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
                <ImageGeneratorSection
                  character={character}
                  storyStackId={storyStack.id}
                  isSaving={isSaving}
                  onAddImage={onAddImage}
                  onRemoveImage={onRemoveImage}
                />
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
                <AvatarGeneratorSection
                  character={character}
                  storyStackId={storyStack.id}
                  isSaving={isSaving}
                  onSetAvatar={onSetAvatar}
                  onRemoveAvatar={onRemoveAvatar}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
