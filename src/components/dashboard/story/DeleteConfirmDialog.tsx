'use client'

import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

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
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      size="md"
      className="border-destructive shadow-[8px_8px_0px_0px_hsl(var(--destructive))]"
    >
      <ModalHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-6 h-6 text-destructive" />
          <ModalTitle>Delete Story</ModalTitle>
        </div>
        <ModalDescription className="pt-2">
          Are you sure you want to delete <strong>"{storyName}"</strong>?
          This will permanently delete all cards, choices, and images. This action cannot be undone.
        </ModalDescription>
      </ModalHeader>

      <ModalFooter>
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
          data-testid="delete-confirm-btn"
        >
          Delete Story
        </Button>
      </ModalFooter>
    </Modal>
  )
}
