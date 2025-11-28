'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Play } from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/contexts/ThemeContext'

export default function Home() {
  const [_user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()
  const { theme } = useTheme()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
      if (user) {
        router.push('/dashboard')
      }
    })
  }, [])

  const handleDemoMode = () => {
    // Set a demo flag in localStorage and cookie
    localStorage.setItem('demoMode', 'true')
    // Set cookie for middleware
    document.cookie = 'demoMode=true; path=/; max-age=86400' // 24 hours
    router.push('/dashboard')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-foreground">Loading...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-theme relative overflow-hidden">
      {/* Theme toggle in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Retro grid background */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--border))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--border))_1px,transparent_1px)] bg-size-[50px_50px]" />
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center px-4 relative z-10"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mb-8 flex justify-center"
        >
          <div className="w-24 h-24 bg-primary border-4 border-border shadow-theme-lg flex items-center justify-center">
            <div className="text-primary-foreground text-4xl font-bold">HC</div>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-6xl font-bold mb-4 tracking-tight text-foreground"
          style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}
        >
          HyperCard Renaissance
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
        >
          Create interactive stacks with modern technology.
          A web-based resurrection of Apple's legendary HyperCard,
          reimagined for the modern era.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex gap-4 justify-center flex-wrap"
        >
          <Link href="/login">
            <Button
              size="lg"
              className="border-4 border-border shadow-theme hover:shadow-theme-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg px-8 py-6"
            >
              Get Started
            </Button>
          </Link>

          <Button
            size="lg"
            variant="outline"
            onClick={handleDemoMode}
            className="border-4 border-border shadow-theme hover:shadow-theme-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg px-8 py-6"
          >
            <Play className="w-5 h-5 mr-2" />
            Try Demo
          </Button>

          <Link href="/login">
            <Button
              size="lg"
              variant="ghost"
              className="text-lg px-8 py-6 hover:bg-muted"
            >
              Sign In
            </Button>
          </Link>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left"
        >
          <div className="p-6 bg-card border-4 border-border shadow-theme">
            <div className="text-2xl mb-2">🎨</div>
            <h3 className="font-bold mb-2 text-foreground">Visual Editor</h3>
            <p className="text-sm text-muted-foreground">
              Drag and drop elements to create interactive cards
            </p>
          </div>

          <div className="p-6 bg-card border-4 border-border shadow-theme">
            <div className="text-2xl mb-2">⚡</div>
            <h3 className="font-bold mb-2 text-foreground">Scripting</h3>
            <p className="text-sm text-muted-foreground">
              Add interactivity with simple JavaScript
            </p>
          </div>

          <div className="p-6 bg-card border-4 border-border shadow-theme">
            <div className="text-2xl mb-2">🚀</div>
            <h3 className="font-bold mb-2 text-foreground">Instant Preview</h3>
            <p className="text-sm text-muted-foreground">
              See your changes in real-time
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}
