'use client'

import { useState } from 'react'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'

interface CreateStoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (name: string, description: string) => Promise<void>
}

export function CreateStoryDialog({ open, onOpenChange, onCreate }: CreateStoryDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [creating, setCreating] = useState(false)

  const handleCreate = async () => {
    if (!name.trim()) return

    try {
      setCreating(true)
      await onCreate(name, description)
      // Reset form
      setName('')
      setDescription('')
      onOpenChange(false)
    } catch (error) {
      console.error('Failed to create story:', error)
    } finally {
      setCreating(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleCreate()
    }
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size="md">
      <ModalHeader>
        <ModalTitle>Create New Story</ModalTitle>
        <ModalDescription>
          Give your adventure story a name and optional description
        </ModalDescription>
      </ModalHeader>

      <ModalBody>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="story-name">Story Name</Label>
            <Input
              id="story-name"
              placeholder="My Adventure Story"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="story-name-input"
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="story-description">Description (optional)</Label>
            <Input
              id="story-description"
              placeholder="A thrilling adventure through..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              onKeyDown={handleKeyDown}
              data-testid="story-description-input"
            />
          </div>
        </div>
      </ModalBody>

      <ModalFooter>
        <Button
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={creating}
          data-testid="create-story-cancel-btn"
        >
          Cancel
        </Button>
        <Button
          onClick={handleCreate}
          disabled={!name.trim() || creating}
          data-testid="create-story-confirm-btn"
        >
          {creating ? 'Creating...' : 'Create'}
        </Button>
      </ModalFooter>
    </Modal>
  )
}
