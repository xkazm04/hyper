'use client'

import { cn } from '@/lib/utils'
import { Check, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SaveButtonProps {
  onSave: () => void
  isSaving: boolean
  hasChanges: boolean
  disabled?: boolean
  className?: string
  label?: string
  savingLabel?: string
}

export function SaveButton({
  onSave,
  isSaving,
  hasChanges,
  disabled = false,
  className,
  label = 'Save',
  savingLabel = 'Saving...'
}: SaveButtonProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 pt-4 border-t border-border', className)}>
      {hasChanges && (
        <span className="text-xs text-muted-foreground">Unsaved changes</span>
      )}
      <Button
        onClick={onSave}
        disabled={isSaving || !hasChanges || disabled}
        className="min-w-[100px]"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {savingLabel}
          </>
        ) : (
          <>
            <Check className="w-4 h-4 mr-2" />
            {label}
          </>
        )}
      </Button>
    </div>
  )
}
