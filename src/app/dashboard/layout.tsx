'use client'

import { useAuth } from '@/lib/auth/AuthContext'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { DashboardDecorations } from './components/DashboardDecorations'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-border border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-theme relative">
      {/* Decorative SVG background elements */}
      <DashboardDecorations />

      <header className="relative z-10 bg-card border-b-4 border-border shadow-theme-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Adventure Story Creator</h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground font-mono hidden sm:inline">
                {user?.email}
              </span>
              <ThemeToggle />
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="border-2 border-border shadow-theme-sm hover:shadow-theme hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </header>
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  )
}
