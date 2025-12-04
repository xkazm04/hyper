'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
  Play,
  GitBranch,
  Sparkles,
  Image as ImageIcon,
  Users,
  Share2,
  Palette,
} from 'lucide-react'
import { motion } from 'framer-motion'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { useTheme } from '@/hooks/useTheme'

export default function Home() {
  const [_user, setUser] = useState<unknown>(null)
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
    localStorage.setItem('demoMode', 'true')
    document.cookie = 'demoMode=true; path=/; max-age=86400'
    router.push('/dashboard')
  }

  // Theme-aware filter for decorative SVGs
  const decorativeFilter = theme === 'light'
    ? 'grayscale(100%) brightness(0.15) opacity(0.12)'
    : 'opacity(0.2) hue-rotate(-10deg)'

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-border border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-theme relative overflow-hidden">
      {/* Theme toggle */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      {/* Decorative SVGs - Background Layer */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        {/* Halloween scene - large, top-left */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="absolute -top-20 -left-20 w-[500px] h-[500px]"
          style={{ filter: decorativeFilter }}
        >
          <Image
            src="/decorative/halloween.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Pumpkin - bottom-left */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className="absolute -bottom-10 left-10 w-72 h-72"
          style={{ filter: decorativeFilter }}
        >
          <Image
            src="/decorative/pumpkin.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Skull - bottom-right */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="absolute -bottom-16 -right-10 w-80 h-80"
          style={{ filter: decorativeFilter }}
        >
          <Image
            src="/decorative/skull.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </motion.div>

        {/* Retro grid overlay */}
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:60px_60px]" />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <section className="flex-1 flex items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="max-w-4xl mx-auto text-center"
          >
            {/* Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
              className="mb-8 flex justify-center"
            >
              <div className="relative">
                <div className="w-28 h-28 bg-primary border-4 border-border shadow-theme-lg flex items-center justify-center">
                  <GitBranch className="w-12 h-12 text-primary-foreground" />
                </div>
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
                  className="absolute -top-2 -right-2 w-8 h-8 bg-accent border-2 border-border rounded-full flex items-center justify-center text-sm"
                >
                  <Sparkles className="w-4 h-4" />
                </motion.div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight text-foreground"
            >
              HyperCard
              <span className="block text-primary">Renaissance</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Create <strong className="text-foreground">branching interactive stories</strong> with
              AI-generated imagery and choice-based navigation.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex gap-4 justify-center flex-wrap mb-16"
            >
              <Link href="/login">
                <Button
                  size="lg"
                  className="border-4 border-border shadow-theme hover:shadow-theme-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg px-8 py-6 font-semibold"
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Get Started Free
                </Button>
              </Link>

              <Button
                size="lg"
                variant="outline"
                onClick={handleDemoMode}
                className="border-4 border-border shadow-theme hover:shadow-theme-lg hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all text-lg px-8 py-6 font-semibold"
              >
                <Play className="w-5 h-5 mr-2" />
                Try Demo
              </Button>
            </motion.div>
          </motion.div>
        </section>

        {/* Features Section */}
        <section className="relative z-10 px-4 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.7 }}
            className="max-w-6xl mx-auto"
          >
            <h2 className="text-2xl font-bold text-center mb-10 text-foreground">
              Everything you need to create interactive narratives
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1: Story Graph */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 border-2 border-border rounded-lg flex items-center justify-center mb-4">
                  <GitBranch className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Visual Story Graph</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Design branching narratives with an interactive node-based editor.
                  Drag, connect, and visualize your story's flow in real-time.
                </p>
              </motion.div>

              {/* Feature 2: AI Images */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 border-2 border-border rounded-lg flex items-center justify-center mb-4">
                  <ImageIcon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">AI Image Generation</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Generate stunning visuals for your story cards using DALL-E.
                  Bring your scenes to life with a single prompt.
                </p>
              </motion.div>

              {/* Feature 3: AI Scripts */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 border-2 border-border rounded-lg flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">AI Script Assistant</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Let Claude AI help write compelling narrative content and
                  suggest story choices that keep readers engaged.
                </p>
              </motion.div>

              {/* Feature 4: Characters */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 border-2 border-border rounded-lg flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Character System</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Create reusable characters with AI-generated avatars.
                  Define archetypes, appearances, and use them across your story.
                </p>
              </motion.div>

              {/* Feature 5: Themes */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 border-2 border-border rounded-lg flex items-center justify-center mb-4">
                  <Palette className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Themed Experience</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Switch between light and Halloween themes with atmospheric
                  effects, sounds, and visual decorations.
                </p>
              </motion.div>

              {/* Feature 6: Publishing */}
              <motion.div
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-shadow"
              >
                <div className="w-12 h-12 bg-primary/10 border-2 border-border rounded-lg flex items-center justify-center mb-4">
                  <Share2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-bold text-lg mb-2 text-foreground">Publish & Share</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Publish your stories with a unique URL. Share your interactive
                  adventures with anyone, anywhere.
                </p>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="relative z-10 py-8 border-t-4 border-border bg-card/50 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              Reimagining HyperCard for the modern web
            </p>
            <div className="flex gap-6">
              <Link
                href="/login"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Sign In
              </Link>
              <button
                onClick={handleDemoMode}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                Try Demo
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
