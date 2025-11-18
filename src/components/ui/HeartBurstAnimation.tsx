'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Heart } from "lucide-react"

interface HeartBurstAnimationProps {
  isActive: boolean
  onComplete?: () => void
}

interface HeartParticle {
  id: number
  angle: number
  distance: number
  delay: number
}

export function HeartBurstAnimation({ isActive, onComplete }: HeartBurstAnimationProps) {
  const [particles, setParticles] = React.useState<HeartParticle[]>([])

  React.useEffect(() => {
    if (isActive) {
      // Generate 8 heart particles in different directions
      const newParticles: HeartParticle[] = []
      for (let i = 0; i < 8; i++) {
        newParticles.push({
          id: Date.now() + i,
          angle: (i * 360) / 8, // Evenly distribute around circle
          distance: 40 + Math.random() * 20, // Random distance 40-60px
          delay: Math.random() * 0.1, // Slight random delay
        })
      }
      setParticles(newParticles)

      // Clear particles after animation completes
      const timer = setTimeout(() => {
        setParticles([])
        onComplete?.()
      }, 800)

      return () => clearTimeout(timer)
    }
  }, [isActive, onComplete])

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible" data-testid="heart-burst-animation">
      <AnimatePresence>
        {particles.map((particle) => {
          // Calculate x and y based on angle and distance
          const radians = (particle.angle * Math.PI) / 180
          const x = Math.cos(radians) * particle.distance
          const y = Math.sin(radians) * particle.distance

          return (
            <motion.div
              key={particle.id}
              className="absolute top-1/2 left-1/2"
              initial={{
                x: 0,
                y: 0,
                scale: 0,
                opacity: 1,
              }}
              animate={{
                x,
                y,
                scale: [0, 1.2, 0],
                opacity: [1, 1, 0],
              }}
              transition={{
                duration: 0.6,
                delay: particle.delay,
                ease: "easeOut",
              }}
              style={{
                marginLeft: '-12px',
                marginTop: '-12px',
              }}
            >
              <Heart
                className="w-6 h-6 fill-red-500 text-red-500"
                aria-hidden="true"
              />
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
