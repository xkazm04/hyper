'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditorProvider, useEditor } from '@/contexts/EditorContext'
import { useStoryEditor } from '@/lib/hooks/useStoryEditor'
import StoryEditorLayout from '@/app/features/editor/story/StoryEditorLayout'
import StoryEditorToolbar from '@/app/features/editor/story/StoryEditorToolbar'
import CardList from '@/app/features/editor/story/CardList'
import StoryCardEditor from '@/app/features/editor/story/sub_StoryCardEditor/StoryCardEditor'
import { PublishDialog } from '@/app/features/editor/story/sub_PublishDialog'
import CharacterList from '@/app/features/editor/story/sub_Characters/CharacterList'
import CharacterEditor from '@/app/features/editor/story/sub_Characters/CharacterEditor'
import CelebrationConfetti from '@/app/features/editor/story/sub_Characters/components/CelebrationConfetti'
import { useCharacterCelebration } from '@/app/features/editor/story/sub_Characters/lib/useCharacterCelebration'
import CardPreview from '@/app/features/editor/story/CardPreview'
import {
  CommandPalette,
  CommandPaletteProvider,
  CommandRippleProvider,
  CommandRippleOverlay,
  useCommands,
} from '@/app/features/editor/story/sub_CommandPalette'
import {
  StoryPathPreview,
  StoryPathPreviewProvider,
} from '@/app/features/editor/story/sub_StoryPathPreview'
import { UndoRedoProvider } from '@/app/features/editor/undo-redo'
import { StoryService } from '@/lib/services/story'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function EditorPage({ params }: { params: Promise<{ stackId: string }> }) {
  const { stackId } = use(params)

  // Validate stackId is present
  if (!stackId || typeof stackId !== 'string' || stackId.trim() === '') {
    return <ErrorState message="Invalid story ID" />
  }

  return (
    <EditorProvider>
      <CommandPaletteProvider>
        <CommandRippleProvider>
          <StoryPathPreviewProvider>
            <UndoRedoWrapper stackId={stackId} />
            <CommandRippleOverlay />
          </StoryPathPreviewProvider>
        </CommandRippleProvider>
      </CommandPaletteProvider>
    </EditorProvider>
  )
}

function UndoRedoWrapper({ stackId }: { stackId: string }) {
  return (
    <UndoRedoProvider>
      <EditorContent stackId={stackId} />
    </UndoRedoProvider>
  )
}

function EditorContent({ stackId }: { stackId: string }) {
  const { story, cards, choices, loading, error, createCard } = useStoryEditor(stackId)
  const {
    setStoryStack,
    setStoryCards,
    setCurrentCardId,
    setChoices,
    storyCards,
    setCharacters,
    setCurrentCharacterId,
    addCharacter,
  } = useEditor()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const storyService = new StoryService()
  const { isConfettiActive, celebrateNewCharacter, clearConfetti } = useCharacterCelebration()

  // Initialize editor context when data loads
  useEffect(() => {
    if (story) {
      setStoryStack(story)
    }
  }, [story, setStoryStack])

  useEffect(() => {
    if (cards.length > 0) {
      setStoryCards(cards)
      // Auto-select first card if none selected
      if (!storyCards.find(c => c.id)) {
        setCurrentCardId(cards[0].id)
      }
    }
  }, [cards, setStoryCards])

  useEffect(() => {
    if (choices.length > 0) {
      setChoices(choices)
    }
  }, [choices, setChoices])

  // Load characters
  useEffect(() => {
    const loadCharacters = async () => {
      if (story) {
        try {
          const characters = await storyService.getCharacters(story.id)
          setCharacters(characters)
        } catch (err) {
          console.error('Failed to load characters:', err)
        }
      }
    }
    loadCharacters()
  }, [story?.id])

  const handleAddCard = async () => {
    try {
      const newCard = await createCard({
        title: 'Untitled Card',
        content: '',
        orderIndex: cards.length,
      })
      setCurrentCardId(newCard.id)
    } catch (err) {
      console.error('Failed to create card:', err)
    }
  }

  const handleAddCharacter = async () => {
    if (!story) return

    try {
      const newCharacter = await storyService.createCharacter({
        storyStackId: story.id,
        name: 'Unnamed Character',
        appearance: '',
      })
      addCharacter(newCharacter)
      setCurrentCharacterId(newCharacter.id)

      // Trigger celebration for new character creation
      celebrateNewCharacter(newCharacter.name)
    } catch (err) {
      console.error('Failed to create character:', err)
    }
  }

  const handlePreview = () => {
    if (story?.slug) {
      window.open(`/play/${story.slug}`, '_blank')
    }
  }

  const handlePublish = () => {
    setPublishDialogOpen(true)
  }

  const handlePublishConfirm = async () => {
    if (!story) return

    const published = await storyService.publishStoryStack(story.id)
    setStoryStack(published)
  }

  const handleUnpublish = async () => {
    if (!story) return

    const unpublished = await storyService.unpublishStoryStack(story.id)
    setStoryStack(unpublished)
  }

  // Initialize commands for the command palette (must be called before any early returns)
  const commands = useCommands({
    onAddCard: handleAddCard,
    onAddCharacter: handleAddCharacter,
    onPreview: handlePreview,
    onPublish: handlePublish,
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="editor-loading">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-border mx-auto mb-4" data-testid="editor-loading-spinner"></div>
          <p className="text-muted-foreground">Loading editor...</p>
        </div>
      </div>
    )
  }

  if (error || !story) {
    return <ErrorState message={error?.message || 'Story not found'} />
  }

  return (
    <>
      <CelebrationConfetti
        isActive={isConfettiActive}
        onComplete={clearConfetti}
      />
      <CommandPalette commands={commands} />
      <StoryPathPreview />
      <StoryEditorLayout
        toolbar={
          <StoryEditorToolbar
            onPublish={handlePublish}
          />
        }
        cardList={<CardList onAddCard={handleAddCard} />}
        characterList={({ onSwitchToCharacters }) => (
          <CharacterList
            onAddCharacter={handleAddCharacter}
            onSwitchToCharacters={onSwitchToCharacters}
          />
        )}
        cardEditor={<StoryCardEditor />}
        characterEditor={<CharacterEditor />}
        cardPreview={<CardPreview />}
        onPreview={handlePreview}
        onPublish={handlePublish}
      />

      <PublishDialog
        open={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        storyName={story?.name || ''}
        slug={story?.slug || null}
        isPublished={story?.isPublished || false}
        cardCount={cards.length}
        onPublish={handlePublishConfirm}
        onUnpublish={handleUnpublish}
      />
    </>
  )
}

function ErrorState({ message }: { message: string }) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="editor-error">
      <div className="text-center p-8">
        <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" data-testid="editor-error-icon" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-muted-foreground mb-6" data-testid="editor-error-message">{message}</p>
        <Button
          onClick={() => router.push('/dashboard')}
          className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]"
          data-testid="editor-back-to-dashboard-btn"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
