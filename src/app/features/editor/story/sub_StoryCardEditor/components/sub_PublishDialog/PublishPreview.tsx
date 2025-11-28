'use client'

import { Globe, Lock } from 'lucide-react'

interface PublishPreviewProps {
  storyName: string
  cardCount: number
  isPublished: boolean
}

export function PublishPreview({
  storyName,
  cardCount,
  isPublished,
}: PublishPreviewProps) {
  return (
    <div className="bg-muted/50 rounded-lg p-4 border-2 border-border space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Story</span>
        <span className="font-semibold text-foreground">{storyName}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Cards</span>
        <span className="font-semibold text-foreground">{cardCount}</span>
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Status</span>
        <span className={`font-semibold flex items-center gap-1.5 ${
          isPublished ? 'text-green-600' : 'text-muted-foreground'
        }`}>
          {isPublished ? (
            <>
              <Globe className="w-3.5 h-3.5" />
              Public
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5" />
              Private
            </>
          )}
        </span>
      </div>
    </div>
  )
}
