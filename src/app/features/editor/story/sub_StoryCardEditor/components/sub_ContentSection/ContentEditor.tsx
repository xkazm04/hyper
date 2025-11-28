'use client'

import { Sparkles, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

interface ContentEditorProps {
  title: string
  content: string
  isSaving: boolean
  isGenerating: boolean
  hasContext: boolean
  isLoadingContext: boolean
  onTitleChange: (value: string) => void
  onTitleBlur: () => void
  onContentChange: (value: string) => void
  onContentBlur: () => void
  onGenerateContent: () => void
}

export function ContentEditor({
  title,
  content,
  isSaving,
  isGenerating,
  hasContext,
  isLoadingContext,
  onTitleChange,
  onTitleBlur,
  onContentChange,
  onContentBlur,
  onGenerateContent,
}: ContentEditorProps) {
  return (
    <div className="space-y-8">
      {/* Header with Generate Button */}
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold text-foreground">Card Content</Label>
        {!isLoadingContext && hasContext && (
          <Button
            size="sm"
            variant="outline"
            onClick={onGenerateContent}
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
