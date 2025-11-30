'use client'

import { Check, Copy, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

interface PublishFormProps {
  shareableUrl: string
  copied: boolean
  onCopyUrl: () => void
  onOpenPreview: () => void
}

export function PublishForm({ shareableUrl, copied, onCopyUrl, onOpenPreview }: PublishFormProps) {
  return (
    <div className="space-y-2" data-testid="publish-form">
      <label className="text-sm font-semibold text-foreground">
        Shareable URL
      </label>
      <div className="flex gap-2">
        <Input
          value={shareableUrl}
          readOnly
          data-testid="publish-shareable-url-input"
          className="flex-1 border-2 border-border font-mono text-xs
                     bg-muted/50 shadow-[inset_2px_2px_4px_rgba(0,0,0,0.05)]"
        />
        <Button
          size="sm"
          variant="outline"
          onClick={onCopyUrl}
          data-testid="publish-copy-url-btn"
          className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                     hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                     hover:-translate-x-px hover:-translate-y-px transition-all"
        >
          {copied ? (
            <Check className="w-4 h-4 text-green-600" />
          ) : (
            <Copy className="w-4 h-4" />
          )}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenPreview}
          data-testid="publish-open-preview-btn"
          className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                     hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                     hover:-translate-x-px hover:-translate-y-px transition-all"
        >
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
