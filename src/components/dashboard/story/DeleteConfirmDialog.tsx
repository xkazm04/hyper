'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import { motion } from 'framer-motion'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  storyName: string
  onConfirm: () => Promise<void>
}

export function DeleteConfirmDialog({ open, onOpenChange, storyName, onConfirm }: DeleteConfirmDialogProps) {
  const handleConfirm = async () => {
    await onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-4 border-[hsl(var(--red-600))] shadow-[8px_8px_0px_0px_hsl(var(--red-600))]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <DialogHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-6 h-6 text-[hsl(var(--red-600))]" />
              <DialogTitle>Delete Story</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              Are you sure you want to delete <strong>"{storyName}"</strong>? 
              This will permanently delete all cards, choices, and images. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-6">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              data-testid="delete-cancel-btn"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirm}
              className="bg-[hsl(var(--red-600))] hover:bg-[hsl(var(--red-600))] border-2 border-border"
              data-testid="delete-confirm-btn"
            >
              Delete Story
            </Button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
