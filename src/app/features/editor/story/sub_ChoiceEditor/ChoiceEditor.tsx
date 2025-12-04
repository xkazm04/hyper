'use client'

/**
 * ChoiceEditor Component
 *
 * Unified component for editing story choices.
 * Supports three modes:
 * - inline: Header-only mode for embedding in larger editors (shows add button)
 * - standalone: Full CRUD mode with complete choice list and state management
 * - integrated: Full CRUD mode using useChoicesSection hook
 *
 * Note: AI suggestion generation has been consolidated into the AICompanionBottomPanel's
 * "Next Steps" feature which creates both new cards AND choices in one operation.
 */

import { useState, useEffect } from 'react'
import { Choice, StoryCard } from '@/lib/types'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Plus, Trash2, GripVertical, Loader2 } from 'lucide-react'
import { useToast } from '@/lib/context/ToastContext'
import { ChoiceEditorHeader } from './components/ChoiceEditorHeader'
import { ChoiceList } from './components/ChoiceList'
import { ChoiceForm } from './components/ChoiceForm'
import { ChoiceTargets } from './components/ChoiceTargets'
import { ChoiceConditions } from './components/ChoiceConditions'
import { useChoicesSection } from './hooks/useChoicesSection'

// Props for inline mode (header-only)
interface InlineChoiceEditorProps {
  mode: 'inline'
  choiceCount: number
  isSaving: boolean
  canAddChoices: boolean
  onAddChoice: () => void
}

// Props for standalone mode (full CRUD)
interface StandaloneChoiceEditorProps {
  mode: 'standalone'
  storyStackId: string
  currentCardId: string
  availableCards: StoryCard[]
}

// Props for integrated mode (uses useChoicesSection hook internally)
interface IntegratedChoiceEditorProps {
  mode: 'integrated'
  storyStackId: string
  cardId: string
  availableCards: StoryCard[]
  currentCard?: StoryCard
}

export type ChoiceEditorProps = InlineChoiceEditorProps | StandaloneChoiceEditorProps | IntegratedChoiceEditorProps

export function ChoiceEditor(props: ChoiceEditorProps) {
  if (props.mode === 'inline') {
    return (
      <ChoiceEditorHeader
        choiceCount={props.choiceCount}
        isSaving={props.isSaving}
        canAddChoices={props.canAddChoices}
        onAddChoice={props.onAddChoice}
      />
    )
  }

  if (props.mode === 'integrated') {
    return <IntegratedChoiceEditor {...props} />
  }

  return <StandaloneChoiceEditor {...props} />
}

// Integrated mode uses the useChoicesSection hook
function IntegratedChoiceEditor({
  storyStackId,
  cardId,
  availableCards,
  currentCard,
}: IntegratedChoiceEditorProps) {
  const {
    choices, isLoading, isSaving, editingChoiceId, isGenerating, hasPredecessors,
    suggestedChoices, otherCards, canAddChoices, handleGenerateChoices, handleApplySuggestion,
    handleAddChoice, handleLabelChange, handleLabelBlur, handleTargetChange, handleDeleteChoice,
    getTargetCardTitle, isTargetValid, setEditingChoiceId,
  } = useChoicesSection({ cardId, storyStackId, availableCards, currentCard })

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="choice-editor-loading">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Choices</Label>
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading choices...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4" data-testid="choice-editor-integrated">
      <ChoiceEditorHeader
        choiceCount={choices.length}
        isSaving={isSaving}
        canAddChoices={canAddChoices}
        onAddChoice={handleAddChoice}
      />

      <ChoiceList
        choices={choices}
        editingChoiceId={editingChoiceId}
        isSaving={isSaving}
        otherCards={otherCards}
        onLabelChange={handleLabelChange}
        onLabelBlur={handleLabelBlur}
        onFocus={setEditingChoiceId}
        onTargetChange={handleTargetChange}
        onDelete={handleDeleteChoice}
        getTargetCardTitle={getTargetCardTitle}
        isTargetValid={isTargetValid}
      />

      <ChoiceConditions availableCardsCount={availableCards.length} />
    </div>
  )
}

// Standalone mode manages its own state (for backwards compatibility with sub_Choices usage)
function StandaloneChoiceEditor({
  storyStackId,
  currentCardId,
  availableCards,
}: StandaloneChoiceEditorProps) {
  const [choices, setChoices] = useState<Choice[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [editingChoice, setEditingChoice] = useState<string | null>(null)
  const { success, error: showError } = useToast()

  useEffect(() => {
    fetchChoices()
  }, [currentCardId])

  const fetchChoices = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices`
      )
      if (!response.ok) throw new Error('Failed to fetch choices')
      const data = await response.json()
      setChoices(data.choices || [])
    } catch (error) {
      console.error('Error fetching choices:', error)
      showError('Failed to load choices')
    } finally {
      setIsLoading(false)
    }
  }


  const handleAddChoice = async () => {
    const defaultTargetCard = availableCards.find(card => card.id !== currentCardId)
    if (!defaultTargetCard) {
      showError('Create more cards before adding choices')
      return
    }

    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: 'New choice',
            targetCardId: defaultTargetCard.id,
            orderIndex: choices.length,
          }),
        }
      )
      if (!response.ok) throw new Error('Failed to create choice')
      const data = await response.json()
      setChoices([...choices, data.choice])
      setEditingChoice(data.choice.id)
      success('Choice added')
    } catch (error) {
      console.error('Error creating choice:', error)
      showError('Failed to add choice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdateChoice = async (
    choiceId: string,
    updates: { label?: string; targetCardId?: string }
  ) => {
    setIsSaving(true)
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices/${choiceId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updates),
        }
      )
      if (!response.ok) throw new Error('Failed to update choice')
      const data = await response.json()
      setChoices(choices.map(c => (c.id === choiceId ? data.choice : c)))
    } catch (error) {
      console.error('Error updating choice:', error)
      showError('Failed to update choice')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDeleteChoice = async (choiceId: string) => {
    // Immediate deletion without confirmation
    setIsSaving(true)
    // Optimistically remove from UI first
    setChoices(choices.filter(c => c.id !== choiceId))
    try {
      const response = await fetch(
        `/api/stories/${storyStackId}/cards/${currentCardId}/choices/${choiceId}`,
        { method: 'DELETE' }
      )
      if (!response.ok) throw new Error('Failed to delete choice')
      success('Choice deleted')
    } catch (error) {
      console.error('Error deleting choice:', error)
      showError('Failed to delete choice')
      // Revert optimistic update on error
      setChoices(choices)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLabelChange = (choiceId: string, newLabel: string) => {
    setChoices(choices.map(c => c.id === choiceId ? { ...c, label: newLabel } : c))
  }

  const handleLabelBlur = (choiceId: string, newLabel: string, originalLabel: string) => {
    if (newLabel && newLabel !== originalLabel) {
      handleUpdateChoice(choiceId, { label: newLabel })
    }
  }

  const handleTargetChange = (choiceId: string, targetCardId: string) => {
    handleUpdateChoice(choiceId, { targetCardId })
  }

  const validateTargetCard = (targetCardId: string) => {
    return availableCards.some(c => c.id === targetCardId)
  }

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="choice-editor-loading">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-semibold">Choices</Label>
        </div>
        <p className="text-sm text-muted-foreground">Loading choices...</p>
      </div>
    )
  }


  return (
    <div className="space-y-3 sm:space-y-4" data-testid="choice-editor-standalone">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs sm:text-sm font-semibold">Choices</Label>
        <Button
          onClick={handleAddChoice}
          disabled={isSaving || availableCards.length <= 1}
          size="sm"
          variant="outline"
          className="touch-manipulation"
          data-testid="add-choice-btn"
        >
          <Plus className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
          <span className="hidden sm:inline">Add Choice</span>
        </Button>
      </div>

      {choices.length === 0 ? (
        <div className="text-center py-6 sm:py-8 border-2 border-dashed border-border rounded-lg" data-testid="choice-list-empty">
          <p className="text-xs sm:text-sm text-muted-foreground mb-2">No choices yet</p>
          <p className="text-xs text-muted-foreground/70">
            Add choices to let players navigate to other cards
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {choices.map((choice) => {
            const isValid = validateTargetCard(choice.targetCardId)

            return (
              <div
                key={choice.id}
                className="border border-border rounded-lg p-2.5 sm:p-3 bg-card hover:shadow-sm transition-shadow"
                data-testid={`choice-item-${choice.id}`}
              >
                <div className="flex items-start gap-1.5 sm:gap-2">
                  <button
                    className="mt-2 cursor-move text-muted-foreground hover:text-foreground touch-manipulation hidden sm:block"
                    title="Drag to reorder"
                    data-testid={`choice-drag-handle-${choice.id}`}
                  >
                    <GripVertical className="w-4 h-4" />
                  </button>

                  <div className="flex-1 space-y-2 min-w-0">
                    <ChoiceForm
                      choice={choice}
                      isSaving={isSaving}
                      onLabelChange={handleLabelChange}
                      onLabelBlur={handleLabelBlur}
                      onFocus={setEditingChoice}
                    />

                    <ChoiceTargets
                      choice={choice}
                      availableCards={availableCards}
                      currentCardId={currentCardId}
                      isSaving={isSaving}
                      isValid={isValid}
                      onTargetChange={handleTargetChange}
                    />
                  </div>

                  <Button
                    onClick={() => handleDeleteChoice(choice.id)}
                    disabled={isSaving}
                    size="sm"
                    variant="ghost"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 touch-manipulation shrink-0"
                    data-testid={`choice-delete-btn-${choice.id}`}
                  >
                    <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ChoiceConditions availableCardsCount={availableCards.length} />
    </div>
  )
}

// Default export for backwards compatibility
export default ChoiceEditor
