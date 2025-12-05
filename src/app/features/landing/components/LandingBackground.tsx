'use client'

import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { useMousePosition, generateParticles } from '../lib/useLandingAnimations'

// ============================================================================
// Landing Background - Aurora + Particles + Spotlight + Grid
// ============================================================================

interface LandingBackgroundProps {
  theme: string
}

export function LandingBackground({ theme }: LandingBackgroundProps) {
  const mousePosition = useMousePosition()
  const particles = useMemo(() => generateParticles(30), [])

  const isHalloween = theme === 'halloween'

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
      {/* Aurora / Northern Lights Effect */}
      <div className="absolute inset-0">
        <motion.div
          className="absolute top-0 left-1/4 w-[800px] h-[600px] rounded-full blur-[120px]"
          style={{
            background: isHalloween
              ? 'radial-gradient(ellipse, hsl(25 90% 50% / 0.15), transparent 70%)'
              : 'radial-gradient(ellipse, hsl(var(--primary) / 0.12), transparent 70%)',
          }}
          animate={{
            x: [0, 100, -50, 0],
            y: [0, 50, -30, 0],
            scale: [1, 1.2, 0.9, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute top-1/3 right-1/4 w-[600px] h-[500px] rounded-full blur-[100px]"
          style={{
            background: isHalloween
              ? 'radial-gradient(ellipse, hsl(280 70% 50% / 0.12), transparent 70%)'
              : 'radial-gradient(ellipse, hsl(var(--accent) / 0.1), transparent 70%)',
          }}
          animate={{
            x: [0, -80, 60, 0],
            y: [0, -40, 60, 0],
            scale: [1, 0.8, 1.1, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 5,
          }}
        />
        <motion.div
          className="absolute bottom-0 left-1/2 w-[700px] h-[400px] rounded-full blur-[140px]"
          style={{
            background: isHalloween
              ? 'radial-gradient(ellipse, hsl(350 80% 45% / 0.1), transparent 70%)'
              : 'radial-gradient(ellipse, hsl(var(--primary) / 0.08), transparent 70%)',
          }}
          animate={{
            x: [0, 60, -80, 0],
            y: [0, -60, 40, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 10,
          }}
        />
      </div>

      {/* Floating Particles */}
      <div className="absolute inset-0">
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            className="absolute rounded-full"
            style={{
              left: `${particle.x}%`,
              bottom: '-10px',
              width: particle.size,
              height: particle.size,
              background: isHalloween
                ? 'hsl(25 90% 60% / 0.6)'
                : 'hsl(var(--primary) / 0.4)',
              boxShadow: isHalloween
                ? '0 0 6px hsl(25 90% 60% / 0.4)'
                : '0 0 6px hsl(var(--primary) / 0.3)',
            }}
            animate={{
              y: [0, -window.innerHeight - 100],
              opacity: [0, 1, 1, 0],
              scale: [0.5, 1, 1, 0.5],
            }}
            transition={{
              duration: particle.duration,
              repeat: Infinity,
              delay: particle.delay,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Mouse Spotlight Effect */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{
          background: isHalloween
            ? 'radial-gradient(circle, hsl(25 80% 50% / 0.08), transparent 60%)'
            : 'radial-gradient(circle, hsl(var(--primary) / 0.06), transparent 60%)',
          left: mousePosition.x - 200,
          top: mousePosition.y - 200,
        }}
        transition={{ type: 'spring', damping: 30, stiffness: 200 }}
      />

      {/* Glow Orbs */}
      <motion.div
        className="absolute top-20 right-20 w-32 h-32 rounded-full blur-2xl"
        style={{
          background: isHalloween
            ? 'hsl(25 90% 50% / 0.2)'
            : 'hsl(var(--primary) / 0.15)',
        }}
        animate={{
          scale: [1, 1.3, 1],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      <motion.div
        className="absolute bottom-40 left-20 w-24 h-24 rounded-full blur-xl"
        style={{
          background: isHalloween
            ? 'hsl(280 70% 50% / 0.15)'
            : 'hsl(var(--accent) / 0.12)',
        }}
        animate={{
          scale: [1, 1.4, 1],
          opacity: [0.2, 0.5, 0.2],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: 2,
        }}
      />

      {/* Retro Grid Overlay */}
      <div className="absolute inset-0 opacity-[0.03]">
        <div className="absolute inset-0 bg-[linear-gradient(hsl(var(--foreground))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--foreground))_1px,transparent_1px)] bg-[size:60px_60px]" />
      </div>

      {/* Vignette Effect */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 0%, hsl(var(--background) / 0.4) 100%)',
        }}
      />
    </div>
  )
}
