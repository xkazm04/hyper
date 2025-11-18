'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EditorProvider, useEditor } from '@/contexts/EditorContext'
import { useStoryEditor } from '@/lib/hooks/useStoryEditor'
import StoryEditorLayout from '@/components/editor/story/StoryEditorLayout'
import StoryEditorToolbar from '@/components/editor/story/StoryEditorToolbar'
import CardList from '@/components/editor/story/CardList'
import CardEditor from '@/components/editor/story/CardEditor'
import StoryGraph from '@/components/editor/story/StoryGraph'
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
  const { story, cards, loading, error, createCard } = useStoryEditor(stackId)
  const {
    setStoryStack,
    setStoryCards,
    setCurrentCardId,
    storyCards,
  } = useEditor()
  const [publishDialogOpen, setPublishDialogOpen] = useState(false)
  const storyService = new StoryService()

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading editor...</p>
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
          />
        }
        cardList={<CardList onAddCard={handleAddCard} />}
        cardEditor={<CardEditor />}
        storyGraph={<StoryGraph />}
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
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center p-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">Error</h2>
        <p className="text-gray-600 mb-6">{message}</p>
        <Button
          onClick={() => router.push('/dashboard')}
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  )
}
