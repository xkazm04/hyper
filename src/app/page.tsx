'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/hooks/useTheme'

// Eagerly loaded components (above the fold)
import {
  LandingBackground,
  PacmanGhost,
  HeroSection,
  DecorativeSVGs,
} from '@/app/features/landing/components'

// Lazy loaded components (below the fold)
const FeaturesSection = lazy(() =>
  import('@/app/features/landing/components/FeaturesSection').then(m => ({ default: m.FeaturesSection }))
)
const ShowcaseSection = lazy(() =>
  import('@/app/features/landing/components/ShowcaseSection').then(m => ({ default: m.ShowcaseSection }))
)
const FooterSection = lazy(() =>
  import('@/app/features/landing/components/FooterSection').then(m => ({ default: m.FooterSection }))
)

// ============================================================================
// Loading Skeleton
// ============================================================================

function SectionSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-20">
      <div className="animate-pulse">
        <div className="h-8 bg-muted rounded w-1/3 mx-auto mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 bg-muted rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  )
}

// ============================================================================
// Main Landing Page
// ============================================================================

export default function Home() {
  const [_user, setUser] = useState<unknown>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()

  const isHalloween = theme === 'halloween'

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) {
        router.push('/dashboard')
      }
    })
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-border border-t-primary rounded-full animate-spin" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-b-primary/30 rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-theme relative overflow-hidden">
      {/* Theme toggle - fixed position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Background effects layer */}
      <LandingBackground theme={theme} />

      {/* Decorative SVGs layer */}
      <DecorativeSVGs theme={theme} />

      {/* PacMan Ghost - only in Halloween theme */}
      <PacmanGhost enabled={isHalloween} />

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section - eagerly loaded */}
        <HeroSection theme={theme} />

        {/* Features Section - lazy loaded */}
        <Suspense fallback={<SectionSkeleton />}>
          <FeaturesSection />
        </Suspense>

        {/* Showcase Section - lazy loaded */}
        <Suspense fallback={<SectionSkeleton />}>
          <ShowcaseSection />
        </Suspense>

        {/* Footer Section - lazy loaded */}
        <Suspense fallback={<div className="h-32 bg-card/50" />}>
          <FooterSection />
        </Suspense>
      </div>
    </div>
  )
}
