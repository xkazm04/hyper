'use client'

import { use, useState, useEffect } from 'react'
import { StoryStack } from '@/lib/types'
import { StoryService } from '@/lib/services/story/index'
import StoryPlayer from '@/components/player/StoryPlayer'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function PlayStoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params)
  const [stack, setStack] = useState<StoryStack | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadStory()
  }, [slug])

  const loadStory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const storyService = new StoryService()
      const publishedStack = await storyService.getPublishedStoryStack(slug)
      
      if (!publishedStack) {
        setError('Story not found')
        return
      }

      setStack(publishedStack)
    } catch (err) {
      console.error('Failed to load story:', err)
      setError('Failed to load story')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-lg font-semibold text-slate-900">Loading story...</div>
        </div>
      </div>
    )
  }

  if (error || !stack) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center max-w-md mx-auto p-8">
          <h1 className="text-2xl font-bold mb-4 text-slate-900">Story not found</h1>
          <p className="text-slate-600 mb-6">
            {error || 'This story doesn\'t exist or hasn\'t been published yet.'}
          </p>
          <Link href="/dashboard">
            <Button className="bg-slate-900 hover:bg-slate-800 text-white">
              Go to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return <StoryPlayer stack={stack} />
}
