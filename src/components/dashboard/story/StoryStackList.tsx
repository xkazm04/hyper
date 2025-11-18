'use client'

import { StoryStack } from '@/lib/types'
import { StoryStackCard } from './StoryStackCard'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { motion } from 'framer-motion'

interface StoryStackListProps {
  stories: StoryStack[]
  onDelete: (id: string, name: string) => void
  onCreateClick: () => void
}

export function StoryStackList({ stories, onDelete, onCreateClick }: StoryStackListProps) {
  if (stories.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <Card className="border-4 border-dashed border-muted-foreground bg-muted">
          <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 px-4">
            <div className="text-5xl sm:text-6xl mb-4">📚</div>
            <p className="text-muted-foreground mb-6 text-base sm:text-lg text-center">No stories yet. Create your first adventure!</p>
            <Button
              onClick={onCreateClick}
              size="lg"
              className="border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all touch-manipulation"
              data-testid="create-first-story-btn"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Create Story
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
      {stories.map((story, index) => (
        <StoryStackCard
          key={story.id}
          story={story}
          onDelete={onDelete}
          index={index}
        />
      ))}
    </div>
  )
}
