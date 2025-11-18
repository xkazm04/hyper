'use client'

import { useEditor } from '@/contexts/EditorContext'
import { FileText } from 'lucide-react'
import ChoiceEditor from './ChoiceEditor'

export default function CardEditor() {
  const { currentCard, storyStack, storyCards } = useEditor()

  if (!currentCard) {
    return (
      <div className="h-full flex items-center justify-center bg-muted">
        <div className="text-center">
          <FileText className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Card Selected</h3>
          <p className="text-sm text-muted-foreground">
            Select a card from the list or create a new one to start editing
          </p>
        </div>
      </div>
    )
  }

  if (!storyStack) {
    return null
  }

  return (
    <div className="h-full overflow-y-auto bg-muted p-3 sm:p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Card content editor would go here - implemented in task 9 */}
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">
            {currentCard.title || 'Untitled Card'}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Card content editor (title, content, image) is implemented in task 9
          </p>
        </div>

        {/* Choice Editor - Task 10 */}
        <div className="bg-card rounded-lg border p-4 sm:p-6">
          <ChoiceEditor
            storyStackId={storyStack.id}
            currentCardId={currentCard.id}
            availableCards={storyCards}
          />
        </div>
      </div>
    </div>
  )
}
