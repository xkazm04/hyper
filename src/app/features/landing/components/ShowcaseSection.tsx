'use client'

import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'

// ============================================================================
// Showcase Section - Testimonials / Stats / Marquee
// ============================================================================

const stats = [
  { value: '', label: 'Stories Created' },
  { value: 'X', label: 'Choices Made' },
  { value: '100+', label: 'AI Images Generated' },
  { value: '∞', label: 'Possibilities' },
]

const showcaseItems = [
  'Visual Story Editing',
  'AI-Powered Images',
  'Branching Narratives',
  'One-Click Publishing',
  'Audio Narration',
  'Halloween Theme',
  'Preset artstyles',
  'Character Development',
  'Plot Twist Suggestions',
  'Interactive Maps'
]

export function ShowcaseSection() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  return (
    <section ref={ref} className="relative z-10 py-20 overflow-hidden">
      {/* Stats Section */}
      {/* <div className="max-w-6xl mx-auto px-4 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-6"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={isInView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: 0.1 * index, duration: 0.5 }}
              className="text-center p-6 bg-card/50 backdrop-blur-sm border-2 border-border rounded-lg"
            >
              <motion.div
                className="text-4xl md:text-5xl font-bold text-primary mb-2"
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.2 + 0.1 * index }}
              >
                {stat.value}
              </motion.div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </div> */}

      {/* Marquee / Ticker */}
      <div className="relative">
        {/* Gradient masks */}
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />

        {/* First row - left to right */}
        <div className="flex overflow-hidden mb-4">
          <motion.div
            className="flex gap-4 whitespace-nowrap"
            animate={{ x: ['0%', '-50%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
          >
            {[...showcaseItems, ...showcaseItems].map((item, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-card border-2 border-border rounded-full text-sm font-medium text-foreground"
              >
                {item}
              </div>
            ))}
          </motion.div>
        </div>

        {/* Second row - right to left */}
        <div className="flex overflow-hidden">
          <motion.div
            className="flex gap-4 whitespace-nowrap"
            animate={{ x: ['-50%', '0%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          >
            {[...showcaseItems.reverse(), ...showcaseItems].map((item, index) => (
              <div
                key={index}
                className="px-6 py-3 bg-primary/10 border-2 border-primary/30 rounded-full text-sm font-medium text-primary"
              >
                {item}
              </div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Quote / Testimonial */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.4, duration: 0.6 }}
        className="max-w-3xl mx-auto px-4 mt-16 text-center"
      >
        <blockquote className="relative">
          <p className="text-xl md:text-2xl text-foreground italic leading-relaxed mb-4">
            HyperCard Renaissance brings back the magic of storytelling with modern AI superpowers.
            It's like having a creative partner that never runs out of ideas.
          </p>
        </blockquote>
      </motion.div>
    </section>
  )
}
