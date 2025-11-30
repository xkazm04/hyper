'use client'

import { use, useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { WasmPlayer } from '@/app/features/wasm-runtime/components/WasmPlayer'
import type { CompiledStoryBundle } from '@/app/features/wasm-runtime/lib/types'

interface SharedStoryResponse {
  success: boolean
  shareCode: string
  storyName: string
  storyDescription: string | null
  cardCount: number
  choiceCount: number
  characterCount: number
  bundle: CompiledStoryBundle
  createdAt: string
  error?: string
}

export default function SharedStoryPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = use(params)
  const [bundle, setBundle] = useState<CompiledStoryBundle | null>(null)
  const [storyName, setStoryName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadSharedStory()
  }, [code])

  const loadSharedStory = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/shared/${code}`)
      const data: SharedStoryResponse = await response.json()

      if (!response.ok || !data.success) {
        setError(data.error || 'Story not found')
        return
      }

      setBundle(data.bundle)
      setStoryName(data.storyName)
    } catch (err) {
      console.error('Failed to load shared story:', err)
      setError('Failed to load story')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        data-testid="shared-story-loading"
      >
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <div className="text-lg font-semibold text-white">
            Loading shared story...
          </div>
          <div className="text-sm text-slate-400 mt-2">
            Code: {code}
          </div>
        </div>
      </div>
    )
  }

  if (error || !bundle) {
    return (
      <div
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
        data-testid="shared-story-error"
      >
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1
            className="text-2xl font-bold mb-4 text-white"
            data-testid="shared-story-error-title"
          >
            Story not found
          </h1>
          <p className="text-slate-400 mb-6" data-testid="shared-story-error-message">
            {error || "This shared story doesn't exist or has expired."}
          </p>
          <Link href="/">
            <Button
              className="bg-blue-600 hover:bg-blue-700 text-white"
              data-testid="shared-story-home-btn"
            >
              Go to Home
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div data-testid="shared-story-player">
      <WasmPlayer
        bundle={bundle}
        saveKey={`shared_story_${code}`}
        showOfflineIndicator={true}
        enableValidation={true}
        lastKnownGoodKey={`lkg_shared_${code}`}
      />
    </div>
  )
}
