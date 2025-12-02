'use client'

import { useState, useEffect } from 'react'
import { Upload, FileText, Check, AlertCircle, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Modal, ModalHeader, ModalTitle, ModalBody } from '@/components/ui/modal'
import { StoryTemplateData } from '@/lib/types'

interface StoryTemplateUploadProps {
  storyTemplateData: StoryTemplateData | null
  setStoryTemplateData: (data: StoryTemplateData | null) => void
  demoUrl: string
  setDemoUrl: (url: string) => void
  documentation: string
  setDocumentation: (doc: string) => void
}

export function StoryTemplateUpload({
  storyTemplateData,
  setStoryTemplateData,
  demoUrl,
  setDemoUrl,
  documentation,
  setDocumentation,
}: StoryTemplateUploadProps) {
  const [jsonInput, setJsonInput] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const handleJsonImport = () => {
    try {
      const parsed = JSON.parse(jsonInput)

      // Validate required structure
      if (!parsed.storyStack || !parsed.storyCards || !parsed.choices) {
        throw new Error('Invalid template format: missing storyStack, storyCards, or choices')
      }

      if (!Array.isArray(parsed.storyCards) || !Array.isArray(parsed.choices)) {
        throw new Error('storyCards and choices must be arrays')
      }

      // Calculate metadata
      const metadata = {
        cardCount: parsed.storyCards.length,
        choiceCount: parsed.choices.length,
        estimatedPlayTime: Math.ceil(parsed.storyCards.length * 1.5), // ~1.5 min per card
        complexity: parsed.storyCards.length <= 5 ? 'simple' :
                   parsed.storyCards.length <= 15 ? 'moderate' : 'complex',
      } as const

      const templateData: StoryTemplateData = {
        storyStack: {
          title: parsed.storyStack.title || 'Untitled Story',
          description: parsed.storyStack.description || '',
          theme: parsed.storyStack.theme || 'light',
          firstCardId: parsed.storyStack.firstCardId || null,
        },
        storyCards: parsed.storyCards.map((card: any, index: number) => ({
          id: card.id || `card-${index}`,
          title: card.title || `Card ${index + 1}`,
          content: card.content || '',
          imageUrl: card.imageUrl || null,
          imagePrompt: card.imagePrompt || null,
          orderIndex: card.orderIndex ?? index,
        })),
        choices: parsed.choices.map((choice: any, index: number) => ({
          id: choice.id || `choice-${index}`,
          storyCardId: choice.storyCardId,
          label: choice.label || 'Continue',
          targetCardId: choice.targetCardId || null,
          orderIndex: choice.orderIndex ?? index,
        })),
        metadata,
      }

      setStoryTemplateData(templateData)
      setParseError(null)
    } catch (e: any) {
      setParseError(e.message || 'Invalid JSON format')
      setStoryTemplateData(null)
    }
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return ''
    }
  }

  return (
    <div className="space-y-4">
      <div className="border-t pt-4">
        <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Story Template Data
        </h3>
      </div>

      {/* JSON Import */}
      <div className="space-y-2">
        <Label htmlFor="json-import">Import from JSON</Label>
        <Textarea
          id="json-import"
          placeholder='Paste your story template JSON here...
{
  "storyStack": { "title": "...", "description": "..." },
  "storyCards": [...],
  "choices": [...]
}'
          value={jsonInput}
          onChange={(e) => setJsonInput(e.target.value)}
          className="font-mono text-xs min-h-[150px]"
          data-testid="template-json-input"
        />
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleJsonImport}
            disabled={!jsonInput.trim()}
            data-testid="parse-template-btn"
          >
            <Upload className="w-4 h-4 mr-1" />
            Parse Template
          </Button>
          {storyTemplateData && (
            <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewOpen(true)} data-testid="preview-template-btn">
              <Eye className="w-4 h-4 mr-1" />
              Preview
            </Button>
          )}
        </div>
      </div>

      {parseError && (
        <div className="flex items-center gap-2 text-destructive text-sm">
          <AlertCircle className="w-4 h-4" />
          {parseError}
        </div>
      )}

      {storyTemplateData && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Check className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-700 dark:text-green-300">
                Template Parsed Successfully
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Title:</span>{' '}
                <span className="font-medium">{storyTemplateData.storyStack.title}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Cards:</span>{' '}
                <span className="font-medium">{storyTemplateData.metadata.cardCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Choices:</span>{' '}
                <span className="font-medium">{storyTemplateData.metadata.choiceCount}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Est. Play Time:</span>{' '}
                <span className="font-medium">{storyTemplateData.metadata.estimatedPlayTime} min</span>
              </div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Complexity:</span>{' '}
                <Badge className={getComplexityColor(storyTemplateData.metadata.complexity)}>
                  {storyTemplateData.metadata.complexity}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo URL */}
      <div className="space-y-2">
        <Label htmlFor="demo-url">Demo URL (Optional)</Label>
        <Input
          id="demo-url"
          type="url"
          placeholder="https://example.com/play/your-demo"
          value={demoUrl}
          onChange={(e) => setDemoUrl(e.target.value)}
          data-testid="template-demo-url"
        />
        <p className="text-xs text-muted-foreground">
          Link to a live demo of your story template
        </p>
      </div>

      {/* Documentation */}
      <div className="space-y-2">
        <Label htmlFor="documentation">Documentation (Markdown)</Label>
        <Textarea
          id="documentation"
          placeholder="# Getting Started&#10;&#10;This template includes...&#10;&#10;## Features&#10;- Feature 1&#10;- Feature 2"
          value={documentation}
          onChange={(e) => setDocumentation(e.target.value)}
          className="min-h-[100px]"
          data-testid="template-documentation"
        />
        <p className="text-xs text-muted-foreground">
          Provide documentation to help users customize your template
        </p>
      </div>

      {/* Template Preview Modal */}
      {storyTemplateData && (
        <Modal open={previewOpen} onOpenChange={setPreviewOpen} size="lg">
          <ModalHeader>
            <ModalTitle>Template Preview</ModalTitle>
          </ModalHeader>
          <ModalBody className="max-h-[60vh] overflow-y-auto">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium">Story Stack</h4>
                <p className="text-sm text-muted-foreground">{storyTemplateData.storyStack.title}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Cards ({storyTemplateData.storyCards.length})</h4>
                <div className="space-y-2">
                  {storyTemplateData.storyCards.slice(0, 5).map((card, i) => (
                    <Card key={i} className="p-2">
                      <p className="font-medium text-sm">{card.title}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{card.content}</p>
                    </Card>
                  ))}
                  {storyTemplateData.storyCards.length > 5 && (
                    <p className="text-sm text-muted-foreground">
                      +{storyTemplateData.storyCards.length - 5} more cards
                    </p>
                  )}
                </div>
              </div>
            </div>
          </ModalBody>
        </Modal>
      )}
    </div>
  )
}
