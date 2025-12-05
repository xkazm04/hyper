'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Play, Sparkles } from 'lucide-react'
import { useTypewriter } from '../lib/useLandingAnimations'

// ============================================================================
// Hero Section - Logo, Title, Tagline, CTA
// ============================================================================

interface HeroSectionProps {
  theme: string
}

export function HeroSection({ theme }: HeroSectionProps) {
  const router = useRouter()
  const isHalloween = theme === 'halloween'

  // Typewriter effect for tagline
  const tagline = 'Create branching interactive stories with AI-generated imagery and choice-based navigation.'
  const { displayedText, isComplete } = useTypewriter(tagline, 30, 1000)

  const handleDemoMode = () => {
    localStorage.setItem('demoMode', 'true')
    document.cookie = 'demoMode=true; path=/; max-age=86400'
    router.push('/dashboard')
  }

  return (
    <section className="flex-1 flex items-center justify-center px-4 py-16 min-h-[80vh]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="max-w-4xl mx-auto text-center"
      >
        {/* Logo with SVG */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
          className="mb-8 flex justify-center"
        >
          <div className="relative">
            {/* Main logo container with glow */}
            <motion.div
              className="relative w-32 h-32 md:w-40 md:h-40"
              animate={{
                boxShadow: isHalloween
                  ? [
                      '0 0 20px hsl(25 90% 50% / 0.3)',
                      '0 0 40px hsl(25 90% 50% / 0.5)',
                      '0 0 20px hsl(25 90% 50% / 0.3)',
                    ]
                  : [
                      '0 0 20px hsl(var(--primary) / 0.2)',
                      '0 0 40px hsl(var(--primary) / 0.4)',
                      '0 0 20px hsl(var(--primary) / 0.2)',
                    ],
              }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Image
                src="/decorative/logo.svg"
                alt="HyperCard Renaissance"
                fill
                className="object-contain drop-shadow-lg"
                priority
              />
            </motion.div>
            {/* Orbiting particle */}
            <motion.div
              className="absolute w-3 h-3 rounded-full"
              style={{
                background: isHalloween ? 'hsl(25 90% 60%)' : 'hsl(var(--primary))',
                boxShadow: isHalloween
                  ? '0 0 10px hsl(25 90% 60%)'
                  : '0 0 10px hsl(var(--primary))',
                transformOrigin: '80px 80px',
              }}
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>
        </motion.div>

        {/* Title with animated gradient */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
        >
          <span className="text-foreground">HyperCard</span>
          <motion.span
            className="block bg-clip-text text-transparent"
            style={{
              backgroundImage: isHalloween
                ? 'linear-gradient(90deg, hsl(25 90% 55%), hsl(350 80% 50%), hsl(280 70% 55%), hsl(25 90% 55%))'
                : 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--accent)), hsl(var(--primary)))',
              backgroundSize: '200% auto',
            }}
            animate={{
              backgroundPosition: ['0% center', '200% center'],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'linear',
            }}
          >
            Renaissance
          </motion.span>
        </motion.h1>

        {/* Tagline with typewriter effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed min-h-[4rem]"
        >
          <p>
            {displayedText}
            {!isComplete && (
              <span className="inline-block w-0.5 h-6 bg-primary ml-1 animate-pulse" />
            )}
          </p>
        </motion.div>

        {/* CTA Buttons with enhanced hover */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="flex gap-4 justify-center flex-wrap mb-16"
        >
          <Link href="/login">
            <motion.div
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                size="lg"
                className="border-4 cursor:pointer border-border shadow-theme hover:shadow-theme-lg transition-all text-lg px-8 py-6 font-semibold relative overflow-hidden group"
              >
                {/* Shine effect */}
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                👻
                Let me in
              </Button>
            </motion.div>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="flex justify-center"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center pt-2"
          >
            <motion.div
              animate={{ opacity: [0, 1, 0], y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 bg-muted-foreground/50 rounded-full"
            />
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}
