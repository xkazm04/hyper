'use client'

import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useAutoSave } from '../lib/useAutoSave'
import { updateCard } from '../lib/cardApi'
import { useEditor } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'

interface CardContext {
  id: string
  title: string
  content: string
  orderIndex: number
}

interface PredecessorInfo {
  card: CardContext
  choiceLabel: string
}

interface SuccessorInfo {
  card: CardContext
  choiceLabel: string
}

interface ContentSectionProps {
  cardId: string
  storyStackId: string
  initialTitle: string
  initialContent: string
}

export function ContentSection({
  cardId,
  storyStackId,
  initialTitle,
  initialContent,
}: ContentSectionProps) {
  const { updateCard: updateCardContext } = useEditor()
  const { error: showError, success } = useToast()

  const [title, setTitle] = useState(initialTitle)
  const [content, setContent] = useState(initialContent)
  const [isSaving, setIsSaving] = useState(false)
  
  // LLM generation state
  const [isGenerating, setIsGenerating] = useState(false)
  const [predecessors, setPredecessors] = useState<PredecessorInfo[]>([])
  const [successors, setSuccessors] = useState<SuccessorInfo[]>([])
  const [hasContext, setHasContext] = useState(false)
  const [isLoadingContext, setIsLoadingContext] = useState(true)

  // Sync with props when card changes
  useEffect(() => {
    setTitle(initialTitle)
    setContent(initialContent)
  }, [cardId, initialTitle, initialContent])

  // Fetch predecessors and successors to determine if LLM button should show
  useEffect(() => {
    const fetchContext = async () => {
      setIsLoadingContext(true)
      try {
        const [predResponse, succResponse] = await Promise.all([
          fetch(`/api/stories/${storyStackId}/cards/${cardId}/predecessors`),
          fetch(`/api/stories/${storyStackId}/cards/${cardId}/successors`),
        ])

        if (predResponse.ok) {
          const predData = await predResponse.json()
          setPredecessors(predData.predecessors || [])
        }

        if (succResponse.ok) {
          const succData = await succResponse.json()
          setSuccessors(succData.successors || [])
        }

        // Has context if there are any predecessors or successors
        const predData = predResponse.ok ? await predResponse.json().catch(() => ({})) : {}
        const succData = succResponse.ok ? await succResponse.json().catch(() => ({})) : {}
        
        // Re-fetch to get data
        const pred2 = await fetch(`/api/stories/${storyStackId}/cards/${cardId}/predecessors`)
        const succ2 = await fetch(`/api/stories/${storyStackId}/cards/${cardId}/successors`)
        
        if (pred2.ok && succ2.ok) {
          const p = await pred2.json()
          const s = await succ2.json()
          setPredecessors(p.predecessors || [])
          setSuccessors(s.successors || [])
          setHasContext((p.predecessors?.length > 0) || (s.successors?.length > 0))
        }
      } catch (err) {
        console.error('Error fetching card context:', err)
      } finally {
        setIsLoadingContext(false)
      }
    }

    fetchContext()
  }, [cardId, storyStackId])

  const handleGenerateContent = async () => {
    setIsGenerating(true)
    try {
      const response = await fetch('/api/ai/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predecessors,
          successors,
          currentTitle: title,
          currentContent: content,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate content')
      }

      const data = await response.json()
      
      // Update local state
      setTitle(data.title)
      setContent(data.content)
      
      // Update context for instant graph reflection
      updateCardContext(cardId, { title: data.title, content: data.content })
      
      // Save to database
      await updateCard(storyStackId, cardId, { 
        title: data.title, 
        content: data.content 
      })
      
      success('Content generated successfully')
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate content')
    } finally {
      setIsGenerating(false)
    }
  }

  const saveTitle = useCallback(async () => {
    if (title === initialTitle) return

    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { title })
      updateCardContext(cardId, updated)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save title')
      setTitle(initialTitle)
    } finally {
      setIsSaving(false)
    }
  }, [title, initialTitle, storyStackId, cardId, updateCardContext, showError])

  const saveContent = useCallback(async () => {
    if (content === initialContent) return

    setIsSaving(true)
    try {
      const updated = await updateCard(storyStackId, cardId, { content })
      updateCardContext(cardId, updated)
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to save content')
      setContent(initialContent)
    } finally {
      setIsSaving(false)
    }
  }, [content, initialContent, storyStackId, cardId, updateCardContext, showError])

  const { scheduleSave: scheduleTitleSave } = useAutoSave({
    delay: 800,
    onSave: saveTitle,
  })

  const { scheduleSave: scheduleContentSave } = useAutoSave({
    delay: 800,
    onSave: saveContent,
  })

  const handleTitleChange = (value: string) => {
    setTitle(value)
    // Update context immediately for instant graph reflection
    updateCardContext(cardId, { title: value })
    scheduleTitleSave()
  }

  const handleContentChange = (value: string) => {
    setContent(value)
    // Update context immediately for instant graph reflection
    updateCardContext(cardId, { content: value })
    scheduleContentSave()
  }

  return (
    <div className="space-y-6">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">
          Card Content
        </Label>
        {!isLoadingContext && hasContext && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerateContent}
            disabled={isSaving || isGenerating}
            className="border-2 border-primary/50 hover:border-primary hover:bg-primary/10"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                Generate with AI
              </>
            )}
          </Button>
        )}
      </div>

      {/* Title Field */}
      <div className="space-y-2">
        <Label
          htmlFor="card-title"
          className="text-sm font-semibold text-foreground flex items-center gap-2"
        >
          Card Title
          {isSaving && (
            <span className="text-xs text-muted-foreground font-normal">Saving...</span>
          )}
        </Label>
        <Input
          id="card-title"
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          onBlur={saveTitle}
          placeholder="Enter a title for this card..."
          className="text-lg font-semibold bg-card border-2 border-border
                     focus:border-primary focus:ring-1 focus:ring-primary/20
                     shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]
                     placeholder:text-muted-foreground/50"
          disabled={isSaving || isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          The title appears in the card list and story graph
        </p>
      </div>

      {/* Content Field */}
      <div className="space-y-2">
        <Label
          htmlFor="card-content"
          className="text-sm font-semibold text-foreground"
        >
          Story Content
        </Label>
        <Textarea
          id="card-content"
          value={content}
          onChange={(e) => handleContentChange(e.target.value)}
          onBlur={saveContent}
          placeholder="Write the narrative content for this card...

Describe what the player sees, hears, and experiences at this moment in the story."
          className="min-h-[280px] resize-y bg-card border-2 border-border
                     focus:border-primary focus:ring-1 focus:ring-primary/20
                     shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]
                     placeholder:text-muted-foreground/50
                     leading-relaxed"
          disabled={isSaving || isGenerating}
        />
        <p className="text-xs text-muted-foreground">
          This text will be displayed to the player when they reach this card
        </p>
      </div>
    </div>
  )
}
