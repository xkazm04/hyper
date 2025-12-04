'use client'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'

interface ContentEditorProps {
  title: string
  content: string
  isSaving: boolean
  isGenerating: boolean
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onContentChange: (value: string) => void
  onContentBlur: () => void
}

/**
 * ContentEditor - Card title and story content editor
 *
 * AI generation is now handled by the bottom AICompanionBottomPanel
 * which provides unified AI experience across the Cards module.
 */
export function ContentEditor({
  title,
  content,
  isSaving,
  isGenerating,
  onTitleChange,
  onTitleBlur,
  onContentChange,
  onContentBlur,
}: ContentEditorProps) {
  return (
    <div className="space-y-6">
      {/* Title Field */}
      <div className="space-y-2">
        <Label htmlFor="card-title" className="text-sm font-semibold text-foreground flex items-center gap-2">
          Card Title
          {isSaving && <span className="text-xs text-muted-foreground font-normal">Saving...</span>}
        </Label>
        <Input
          id="card-title"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          onBlur={onTitleBlur}
          placeholder="Enter a title for this card..."
          className="text-lg font-semibold bg-card border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] placeholder:text-muted-foreground/50 halloween-candle-flicker-focus"
          disabled={isSaving || isGenerating}
        />
        <p className="text-xs text-muted-foreground">The title appears in the card list and story graph</p>
      </div>

      {/* Content Field */}
      <div className="space-y-2">
        <Label htmlFor="card-content" className="text-sm font-semibold text-foreground">Story Content</Label>
        <Textarea
          id="card-content"
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          onBlur={onContentBlur}
          placeholder="Write the narrative content for this card..."
          className="min-h-[200px] resize-y bg-card border-2 border-border focus:border-primary focus:ring-1 focus:ring-primary/20 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)] placeholder:text-muted-foreground/50 leading-relaxed halloween-candle-flicker-focus"
          disabled={isSaving || isGenerating}
        />
        <p className="text-xs text-muted-foreground">This text will be displayed to the player when they reach this card</p>
      </div>
    </div>
  )
}
