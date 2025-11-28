'use client'

import { FileText } from 'lucide-react'

interface ContentPreviewProps {
  title: string
  content: string
  message?: string | null
  speaker?: string | null
}

export function ContentPreview({ title, content, message, speaker }: ContentPreviewProps) {
  const hasContent = title || content || message

  if (!hasContent) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <FileText className="w-6 h-6 mx-auto mb-2 opacity-50" />
        <p className="text-xs">No content yet</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {title && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Title</p>
          <p className="font-semibold text-foreground">{title}</p>
        </div>
      )}
      
      {content && (
        <div>
          <p className="text-xs font-medium text-muted-foreground mb-1">Content</p>
          <p className="text-sm text-foreground/80 line-clamp-4">{content}</p>
        </div>
      )}
      
      {message && (
        <div className="p-2 rounded-md bg-muted/50 border border-border/50">
          {speaker && (
            <p className="text-xs font-medium text-primary mb-1">{speaker}</p>
          )}
          <p className="text-sm italic text-foreground/70">&ldquo;{message}&rdquo;</p>
        </div>
      )}
    </div>
  )
}
