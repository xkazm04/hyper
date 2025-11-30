'use client'

import React, { memo, useCallback, useState } from 'react'
import { useThemeLayer } from '../ThemeLayerContext'
import { cn } from '@/lib/utils'
import { Ghost, Skull, Castle, Moon, Trees, Sparkles, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { CardTemplate } from '../lib/types'

interface SpookyCardTemplatesProps {
  className?: string
  onSelectTemplate?: (template: CardTemplate) => void
}

/**
 * Get icon for template based on tags
 */
function getTemplateIcon(template: CardTemplate): React.ReactNode {
  if (template.tags.includes('mansion') || template.tags.includes('crypt')) {
    return <Castle className="h-4 w-4" />
  }
  if (template.tags.includes('forest')) {
    return <Trees className="h-4 w-4" />
  }
  if (template.tags.includes('ghost') || template.tags.includes('graveyard')) {
    return <Ghost className="h-4 w-4" />
  }
  if (template.tags.includes('skeleton') || template.tags.includes('dead')) {
    return <Skull className="h-4 w-4" />
  }
  if (template.tags.includes('witch') || template.tags.includes('magic')) {
    return <Sparkles className="h-4 w-4" />
  }
  return <Moon className="h-4 w-4" />
}

/**
 * Template Card Item
 */
const TemplateCard = memo(function TemplateCard({
  template,
  onSelect,
}: {
  template: CardTemplate
  onSelect: (template: CardTemplate) => void
}) {
  return (
    <button
      className={cn(
        'w-full text-left p-3 rounded-lg border-2 transition-all',
        'bg-card hover:bg-purple-500/10',
        'border-border hover:border-purple-500/50',
        'group cursor-pointer'
      )}
      onClick={() => onSelect(template)}
      data-testid={`template-card-${template.id}`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 group-hover:bg-purple-500/30">
          {getTemplateIcon(template)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-sm truncate">{template.name}</h4>
            <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-purple-400 transition-colors" />
          </div>
          <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
            {template.description}
          </p>
          <div className="flex flex-wrap gap-1 mt-2">
            {template.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag}
                variant="outline"
                className="text-[10px] px-1.5 py-0 bg-purple-500/10 border-purple-500/30"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </button>
  )
})

/**
 * Template Preview Dialog
 */
const TemplatePreviewDialog = memo(function TemplatePreviewDialog({
  template,
  open,
  onOpenChange,
  onUseTemplate,
}: {
  template: CardTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onUseTemplate: (template: CardTemplate) => void
}) {
  if (!template) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getTemplateIcon(template)}
            {template.name}
          </DialogTitle>
          <DialogDescription>{template.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          {/* Title preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Card Title
            </label>
            <p className="mt-1 text-sm font-medium">{template.title}</p>
          </div>

          {/* Content preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Content
            </label>
            <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
              {template.content}
            </p>
          </div>

          {/* Image prompt preview */}
          <div>
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Suggested Image Prompt
            </label>
            <p className="mt-1 text-xs font-mono bg-muted/50 p-2 rounded border border-border">
              {template.imagePrompt}
            </p>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {template.tags.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-xs bg-purple-500/20"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            data-testid="template-preview-cancel-btn"
          >
            Cancel
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700"
            onClick={() => {
              onUseTemplate(template)
              onOpenChange(false)
            }}
            data-testid="template-preview-use-btn"
          >
            Use Template
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})

/**
 * SpookyCardTemplates
 *
 * Panel displaying Halloween-themed card templates that users can use
 * as starting points for their story cards.
 */
export const SpookyCardTemplates = memo(function SpookyCardTemplates({
  className,
  onSelectTemplate,
}: SpookyCardTemplatesProps) {
  const themeLayer = useThemeLayer()
  const [selectedTemplate, setSelectedTemplate] = useState<CardTemplate | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const templates = themeLayer.getCardTemplates()

  const handleSelectTemplate = useCallback((template: CardTemplate) => {
    setSelectedTemplate(template)
    setPreviewOpen(true)
  }, [])

  const handleUseTemplate = useCallback((template: CardTemplate) => {
    if (onSelectTemplate) {
      onSelectTemplate(template)
    }
    // Play success sound
    themeLayer.playSound('success')
  }, [onSelectTemplate, themeLayer])

  // Only show in Halloween theme
  if (themeLayer.theme !== 'halloween' || templates.length === 0) {
    return null
  }

  return (
    <div
      className={cn(
        'rounded-lg border-2 border-border bg-card/50',
        className
      )}
      data-testid="spooky-card-templates-panel"
    >
      <div className="p-3 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ghost className="h-4 w-4 text-purple-400" />
          <h3 className="text-sm font-medium">Spooky Templates</h3>
        </div>
        <Badge variant="outline" className="text-[10px] bg-purple-500/10 border-purple-500/30">
          {templates.length} templates
        </Badge>
      </div>

      <div className="h-[300px] overflow-y-auto">
        <div className="p-2 space-y-2">
          {templates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onSelect={handleSelectTemplate}
            />
          ))}
        </div>
      </div>

      <TemplatePreviewDialog
        template={selectedTemplate}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        onUseTemplate={handleUseTemplate}
      />
    </div>
  )
})

/**
 * Compact button trigger for spooky templates
 */
export const SpookyTemplatesButton = memo(function SpookyTemplatesButton({
  className,
  onSelectTemplate,
}: SpookyCardTemplatesProps) {
  const themeLayer = useThemeLayer()
  const [open, setOpen] = useState(false)

  if (themeLayer.theme !== 'halloween') {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'gap-1.5 bg-purple-500/10 border-purple-500/30 hover:bg-purple-500/20',
            className
          )}
          data-testid="spooky-templates-trigger-btn"
        >
          <Ghost className="h-3.5 w-3.5 text-purple-400" />
          <span className="text-xs">Spooky Templates</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-purple-400" />
            Halloween Card Templates
          </DialogTitle>
          <DialogDescription>
            Choose a spooky template to start your story card
          </DialogDescription>
        </DialogHeader>
        <SpookyCardTemplates
          onSelectTemplate={(template) => {
            onSelectTemplate?.(template)
            setOpen(false)
          }}
        />
      </DialogContent>
    </Dialog>
  )
})

export default SpookyCardTemplates
