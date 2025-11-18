'use client'

import { useState } from 'react'
import { useStories } from '@/lib/hooks/useStories'
import { useAuth } from '@/lib/auth/AuthContext'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'
import { StoryStackList } from '@/components/dashboard/story/StoryStackList'
import { CreateStoryDialog } from '@/components/dashboard/story/CreateStoryDialog'
import { DeleteConfirmDialog } from '@/components/dashboard/story/DeleteConfirmDialog'
import { SearchFilter } from '@/components/dashboard/story/SearchFilter'

export default function DashboardPage() {
  const { stories, loading, createStory, deleteStory } = useStories()
  const { user } = useAuth()
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [deleteDialogState, setDeleteDialogState] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: '',
    name: '',
  })
  const [searchQuery, setSearchQuery] = useState('')

  const handleCreateStory = async (name: string, description: string) => {
    await createStory({
      name,
      description: description || undefined,
    })
  }

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteDialogState({ open: true, id, name })
  }

  const handleDeleteConfirm = async () => {
    await deleteStory(deleteDialogState.id)
  }

  // Filter stories based on search query
  const filteredStories = stories.filter(story => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      story.name.toLowerCase().includes(query) ||
      story.description?.toLowerCase().includes(query)
    )
  })

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-9 w-48 bg-muted rounded animate-pulse" />
            <div className="h-6 w-64 bg-muted/70 rounded mt-2 animate-pulse" />
          </div>
          <div className="h-10 w-32 bg-muted rounded animate-pulse" />
        </div>

        {/* Skeleton cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="border-4 border-muted bg-card p-6 animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="h-6 w-3/4 bg-muted rounded mb-3" />
              <div className="h-4 w-full bg-muted/70 rounded mb-2" />
              <div className="h-4 w-2/3 bg-muted/70 rounded mb-4" />
              <div className="h-3 w-24 bg-muted/70 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">My Stories</h2>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user?.email}
          </p>
        </div>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => setShowCreateDialog(true)}
            size="lg"
            className="border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150"
            data-testid="new-story-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Story
          </Button>
        </motion.div>
      </div>

      {/* Search/Filter */}
      {stories.length > 0 && (
        <div className="max-w-md">
          <SearchFilter
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search stories..."
          />
        </div>
      )}

      {/* Stories List */}
      <StoryStackList
        stories={filteredStories}
        onDelete={handleDeleteClick}
        onCreateClick={() => setShowCreateDialog(true)}
      />

      {/* Show message if search has no results */}
      {searchQuery && filteredStories.length === 0 && stories.length > 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No stories found matching "{searchQuery}"</p>
          <Button
            variant="outline"
            onClick={() => setSearchQuery('')}
            className="mt-4"
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Create Story Dialog */}
      <CreateStoryDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onCreate={handleCreateStory}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmDialog
        open={deleteDialogState.open}
        onOpenChange={(open) => setDeleteDialogState({ ...deleteDialogState, open })}
        storyName={deleteDialogState.name}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  )
}
