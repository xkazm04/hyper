'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

interface AssetPreviewProps {
  promptTemplate: string
  setPromptTemplate: (value: string) => void
  promptStyle: string
  setPromptStyle: (value: string) => void
}

export function AssetPreview({
  promptTemplate,
  setPromptTemplate,
  promptStyle,
  setPromptStyle,
}: AssetPreviewProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-medium">Prompt Template</h3>
      <div className="space-y-2">
        <Label htmlFor="template">Template</Label>
        <Textarea
          id="template"
          value={promptTemplate}
          onChange={(e) => setPromptTemplate(e.target.value)}
          placeholder="A {style} portrait of {character_name}..."
          rows={4}
          data-testid="prompt-template-input"
        />
        <p className="text-xs text-muted-foreground">
          Use {'{variable_name}'} syntax for customizable parts
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="style">Style</Label>
        <Input
          id="style"
          value={promptStyle}
          onChange={(e) => setPromptStyle(e.target.value)}
          placeholder="e.g., Digital Art, Watercolor..."
          data-testid="prompt-style-input"
        />
      </div>
    </div>
  )
}
