'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditorProvider, useEditor } from '@/contexts/EditorContext'
import { useStoryEditor } from '@/lib/hooks/useStoryEditor'
import { useMoodTheme } from '@/lib/hooks/useMoodTheme'
import StoryEditorLayout from '@/components/editor/story/StoryEditorLayout'
import StoryEditorToolbar from '@/components/editor/story/StoryEditorToolbar'
import CardList from '@/components/editor/story/CardList'
import CardEditor from '@/components/editor/story/CardEditor'
import CardPreview from '@/components/editor/story/CardPreview'
import PublishDialog from '@/components/editor/story/PublishDialog'
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
      <EditorContent stackId={stackId} />
    </EditorProvider>
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
  } = useEditor()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const storyService = new StoryService()

  // Mood-based theme sync
  const { moodColors, isLoading: isMoodLoading, refresh: refreshMood } = useMoodTheme({
    storyStack: story,
    storyCards: cards,
    enabled: true,
  })

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
      <StoryEditorLayout
        toolbar={
          <StoryEditorToolbar
            onAddCard={handleAddCard}
            onPreview={handlePreview}
            onPublish={handlePublish}
            moodColors={moodColors}
            isMoodLoading={isMoodLoading}
            onMoodRefresh={refreshMood}
          />
        }
        cardList={<CardList onAddCard={handleAddCard} />}
        cardEditor={<CardEditor />}
        cardPreview={<CardPreview />}
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
