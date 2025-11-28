'use client'

import { AlertCircle } from 'lucide-react'

interface PublishStatusProps {
  canPublish: boolean
  isPublished: boolean
  error: string | null
}

export function PublishStatus({
  canPublish,
  isPublished,
  error,
}: PublishStatusProps) {
  return (
    <>
      {/* Validation Warning */}
      {!canPublish && !isPublished && (
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30
                        border-2 border-amber-300 dark:border-amber-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-200 text-sm">
              Cannot publish yet
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Your story needs at least one card before it can be published.
            </p>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/30
                        border-2 border-red-300 dark:border-red-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-200 text-sm">Error</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-0.5">{error}</p>
          </div>
        </div>
      )}
    </>
  )
}
