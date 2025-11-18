'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { motion } from 'framer-motion'

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-4 border-border shadow-[8px_8px_0px_0px_hsl(var(--border))]">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.15 }}
        >
          <DialogHeader>
            <DialogTitle>Create New Story</DialogTitle>
            <DialogDescription>
              Give your adventure story a name and optional description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
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
          <div className="flex justify-end gap-2 mt-6">
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
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}
