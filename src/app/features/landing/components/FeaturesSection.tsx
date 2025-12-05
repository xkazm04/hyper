'use client'

import { useRef, useState } from 'react'
import { motion, useInView } from 'framer-motion'
import {
  GitBranch,
  Image as ImageIcon,
  Share2,
  Sparkles,
  Users,
  Palette,
} from 'lucide-react'

// ============================================================================
// Features Section - With 3D tilt cards and staggered reveal
// ============================================================================

interface Feature {
  icon: React.ReactNode
  title: string
  description: string
  gradient: string
}

const features: Feature[] = [
  {
    icon: <GitBranch className="w-6 h-6" />,
    title: 'Visual Story Graph',
    description: 'Design branching narratives with an interactive node-based editor. Drag, connect, and visualize your story flow in real-time.',
    gradient: 'from-blue-500/20 to-purple-500/20',
  },
  {
    icon: <ImageIcon className="w-6 h-6" />,
    title: 'LLM Image Generation',
    description: 'Generate stunning visuals for your story cards using LLMs. Bring your scenes to life with a single prompt.',
    gradient: 'from-pink-500/20 to-orange-500/20',
  },
  {
    icon: <Sparkles className="w-6 h-6" />,
    title: 'AI Companion',
    description: 'Get intelligent suggestions for plot twists, character dialogue, and scene descriptions powered by Claude AI.',
    gradient: 'from-violet-500/20 to-indigo-500/20',
  }
]

export function FeaturesSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative z-10 px-4 py-20">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <motion.span
            className="inline-block px-4 py-1.5 rounded-full text-sm font-medium mb-4 border border-border bg-card"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={isInView ? { opacity: 1, scale: 1 } : {}}
            transition={{ delay: 0.2 }}
          >
            ✨ Powerful Features
          </motion.span>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            From visual editing to AI assistance, we've got you covered.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard
              key={feature.title}
              feature={feature}
              index={index}
              isInView={isInView}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

// ============================================================================
// Feature Card with 3D Tilt Effect
// ============================================================================

interface FeatureCardProps {
  feature: Feature
  index: number
  isInView: boolean
}

function FeatureCard({ feature, index, isInView }: FeatureCardProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left - rect.width / 2) / 20
    const y = (e.clientY - rect.top - rect.height / 2) / 20
    setTilt({ x: -y, y: x })
  }

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 })
  }

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.1 * index, duration: 0.5 }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
        transformStyle: 'preserve-3d',
      }}
      className="relative group"
    >
      <div className="p-6 bg-card border-4 border-border shadow-theme hover:shadow-theme-lg transition-all duration-300 rounded-lg overflow-hidden">
        {/* Gradient background on hover */}
        <div
          className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
        />

        {/* Content */}
        <div className="relative z-10">
          <motion.div
            className="w-14 h-14 bg-primary/10 border-2 border-border rounded-xl flex items-center justify-center mb-4 text-primary"
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {feature.icon}
          </motion.div>

          <h3 className="font-bold text-lg mb-2 text-foreground">
            {feature.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>

        {/* Decorative corner */}
        <div className="absolute top-0 right-0 w-16 h-16 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/5 to-transparent rotate-45 translate-x-16 -translate-y-16" />
        </div>
      </div>
    </motion.div>
  )
}
