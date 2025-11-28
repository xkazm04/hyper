'use client'

import { StoryStack } from '@/lib/types'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, BookOpen, Globe } from 'lucide-react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface StoryStackCardProps {
  story: StoryStack
  onDelete: (id: string, name: string) => void
  index: number
}

export function StoryStackCard({ story, onDelete, index }: StoryStackCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.2 }}
      whileHover={{ scale: 1.02, transition: { duration: 0.15 } }}
      whileTap={{ scale: 0.98, transition: { duration: 0.1 } }}
    >
      <Card className="border-4 border-border shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150 relative group bg-card h-full touch-manipulation animate-story-card-hover">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/editor/${story.id}`} className="flex-1 min-w-0">
              <CardTitle className="hover:text-blue-600 transition-colors text-lg sm:text-xl flex items-center gap-2">
                <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 animate-icon-wiggle" />
                <span className="truncate">{story.name}</span>
              </CardTitle>
            </Link>
            {story.isPublished && (
              <div className="flex items-center gap-1 text-[10px] sm:text-xs bg-green-100 text-green-700 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded border-2 border-green-600 shrink-0 animate-badge-sparkle">
                <Globe className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">Published</span>
              </div>
            )}
          </div>
          {story.description && (
            <CardDescription className="mt-2 line-clamp-2 text-xs sm:text-sm">
              {story.description}
            </CardDescription>
          )}
        </CardHeader>
        <CardContent className="p-4 sm:p-6 pt-0">
          <div className="flex justify-between items-center gap-2">
            <div className="text-[10px] sm:text-xs text-muted-foreground font-mono space-y-0.5 sm:space-y-1">
              <div>Updated: {new Date(story.updatedAt).toLocaleDateString()}</div>
              <div>Created: {new Date(story.createdAt).toLocaleDateString()}</div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDelete(story.id, story.name)}
              className="opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 touch-manipulation shrink-0"
              data-testid={`delete-story-btn-${story.id}`}
            >
              <Trash2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
