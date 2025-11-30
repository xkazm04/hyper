'use client'

import React, { memo, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useThemeLayer } from '../ThemeLayerContext'
import { cn } from '@/lib/utils'
import type { OverlayProps } from '../lib/types'

/**
 * Fog Layer Overlay
 * Creates a drifting fog effect at the bottom of the screen
 */
const FogLayerOverlay = memo(function FogLayerOverlay({ intensity, isActive }: OverlayProps) {
  if (!isActive) return null

  return (
    <div
      className="pointer-events-none"
      style={{ opacity: intensity }}
      data-testid="halloween-fog-overlay"
    >
      {/* Primary fog layer */}
      <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-[#1a0a2e]/70 via-[#1a0a2e]/40 to-transparent animate-halloween-fog" />
      {/* Secondary fog layer with offset */}
      <div
        className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-[#2d1b4e]/50 via-transparent to-transparent animate-halloween-fog"
        style={{ animationDelay: '-5s' }}
      />
      {/* Crawling ground mist */}
      <div className="absolute bottom-0 left-0 w-full h-16 overflow-hidden">
        <div
          className="w-[200%] h-full bg-gradient-to-r from-[#1a0a2e]/30 via-[#2d1b4e]/40 to-[#1a0a2e]/30"
          style={{
            animation: 'mistCrawl 30s linear infinite',
          }}
        />
      </div>
    </div>
  )
})

/**
 * Floating Particles Overlay
 * Creates floating purple/orange particles
 */
const FloatingParticlesOverlay = memo(function FloatingParticlesOverlay({ intensity, isActive }: OverlayProps) {
  if (!isActive) return null

  // Generate deterministic particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: `${(i * 5.13) % 100}%`,
    top: `${(i * 7.29) % 100}%`,
    size: 2 + (i % 3),
    delay: i * 0.5,
    duration: 15 + (i % 10),
    color: i % 2 === 0 ? 'hsl(270, 70%, 60%)' : 'hsl(25, 95%, 53%)',
  }))

  return (
    <div
      className="pointer-events-none"
      style={{ opacity: intensity * 0.6 }}
      data-testid="halloween-particles-overlay"
    >
      {particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full animate-halloween-float-slow"
          style={{
            left: particle.left,
            top: particle.top,
            width: particle.size,
            height: particle.size,
            backgroundColor: particle.color,
            boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            animationDelay: `${-particle.delay}s`,
            animationDuration: `${particle.duration}s`,
          }}
        />
      ))}
    </div>
  )
})

/**
 * Vignette Overlay
 * Creates a dark vignette effect around the edges
 */
const VignetteOverlay = memo(function VignetteOverlay({ intensity, isActive }: OverlayProps) {
  if (!isActive) return null

  return (
    <div
      className="pointer-events-none"
      style={{ opacity: intensity }}
      data-testid="halloween-vignette-overlay"
    >
      {/* Radial vignette */}
      <div
        className="absolute inset-0"
        style={{
          background: `radial-gradient(ellipse at center, transparent 0%, transparent 40%, hsl(270, 50%, 5% / ${0.4 * intensity}) 100%)`,
        }}
      />
      {/* Corner darkness */}
      <div className="absolute inset-0 shadow-[inset_0_0_200px_hsl(270,50%,5%/0.6)]" />
    </div>
  )
})

/**
 * Spider Web Overlay
 * Creates decorative spider web in corners
 */
const SpiderWebOverlay = memo(function SpiderWebOverlay({ intensity, isActive }: OverlayProps) {
  if (!isActive) return null

  return (
    <div
      className="pointer-events-none"
      style={{ opacity: intensity * 0.5 }}
      data-testid="halloween-spider-web-overlay"
    >
      {/* Top-right corner web */}
      <svg
        className="absolute top-0 right-0 w-48 h-48"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Web strands */}
        <g stroke="hsl(270, 40%, 45%)" strokeWidth="0.5" opacity="0.6">
          {/* Radial lines */}
          <line x1="100" y1="0" x2="0" y2="100" />
          <line x1="100" y1="0" x2="20" y2="80" />
          <line x1="100" y1="0" x2="40" y2="60" />
          <line x1="100" y1="0" x2="60" y2="40" />
          <line x1="100" y1="0" x2="80" y2="20" />
          {/* Spiral lines */}
          <path d="M95 5 Q 90 10 85 8" />
          <path d="M90 10 Q 80 20 70 15" />
          <path d="M85 15 Q 70 30 55 22" />
          <path d="M80 20 Q 60 40 40 30" />
          <path d="M75 25 Q 50 50 25 38" />
          <path d="M70 30 Q 40 60 10 45" />
        </g>
        {/* Small spider */}
        <g transform="translate(60, 35)" className="animate-halloween-bob">
          <ellipse cx="0" cy="0" rx="2" ry="3" fill="hsl(270, 30%, 20%)" />
          <ellipse cx="0" cy="-3" rx="1.5" ry="1.5" fill="hsl(270, 30%, 20%)" />
        </g>
      </svg>

      {/* Bottom-left corner web */}
      <svg
        className="absolute bottom-0 left-0 w-32 h-32 rotate-180"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <g stroke="hsl(270, 40%, 45%)" strokeWidth="0.5" opacity="0.4">
          <line x1="100" y1="0" x2="0" y2="100" />
          <line x1="100" y1="0" x2="20" y2="80" />
          <line x1="100" y1="0" x2="40" y2="60" />
          <path d="M90 10 Q 80 20 70 15" />
          <path d="M80 20 Q 60 40 40 30" />
        </g>
      </svg>
    </div>
  )
})

/**
 * Floating Ghosts Overlay
 * Creates subtle floating ghost silhouettes
 */
const FloatingGhostsOverlay = memo(function FloatingGhostsOverlay({ intensity, isActive }: OverlayProps) {
  if (!isActive) return null

  return (
    <div
      className="pointer-events-none"
      style={{ opacity: intensity * 0.15 }}
      data-testid="halloween-ghosts-overlay"
    >
      {/* Ghost 1 */}
      <div
        className="absolute text-4xl animate-halloween-float-slow"
        style={{
          top: '20%',
          right: '10%',
          filter: 'blur(1px)',
          animationDuration: '25s',
        }}
      >
        {String.fromCodePoint(0x1F47B)}
      </div>
      {/* Ghost 2 */}
      <div
        className="absolute text-3xl animate-halloween-float-slow"
        style={{
          top: '60%',
          left: '5%',
          filter: 'blur(2px)',
          animationDuration: '30s',
          animationDelay: '-10s',
        }}
      >
        {String.fromCodePoint(0x1F47B)}
      </div>
      {/* Bat 1 */}
      <div
        className="absolute text-2xl animate-halloween-float-slow"
        style={{
          top: '15%',
          left: '25%',
          filter: 'blur(1px)',
          animationDuration: '20s',
          animationDelay: '-5s',
        }}
      >
        {String.fromCodePoint(0x1F987)}
      </div>
    </div>
  )
})

/**
 * Candle Glow Overlay
 * Creates ambient flickering glow effect
 */
const CandleGlowOverlay = memo(function CandleGlowOverlay({ intensity, isActive }: OverlayProps) {
  if (!isActive) return null

  return (
    <div
      className="pointer-events-none"
      style={{ opacity: intensity * 0.3 }}
      data-testid="halloween-candle-glow-overlay"
    >
      {/* Bottom ambient glow */}
      <div
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-64 blur-3xl animate-halloween-candle-flicker"
        style={{
          background: 'radial-gradient(ellipse at bottom, hsl(25, 95%, 53% / 0.15), transparent 70%)',
        }}
      />
      {/* Side glows */}
      <div
        className="absolute top-1/3 left-0 w-48 h-64 blur-3xl animate-halloween-candle-flicker"
        style={{
          background: 'radial-gradient(ellipse at left, hsl(270, 70%, 60% / 0.1), transparent 70%)',
          animationDelay: '-2s',
        }}
      />
      <div
        className="absolute top-1/2 right-0 w-48 h-64 blur-3xl animate-halloween-candle-flicker"
        style={{
          background: 'radial-gradient(ellipse at right, hsl(270, 70%, 60% / 0.1), transparent 70%)',
          animationDelay: '-4s',
        }}
      />
    </div>
  )
})

/**
 * Main Halloween Overlay Component
 * Renders all active Halloween overlay layers
 */
export const HalloweenOverlay = memo(function HalloweenOverlay() {
  const themeLayer = useThemeLayer()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render if not Halloween theme or effects disabled
  if (!mounted || themeLayer.theme !== 'halloween' || !themeLayer.effectsEnabled) {
    return null
  }

  const overlayContent = (
    <div
      className={cn(
        'fixed inset-0 pointer-events-none overflow-hidden',
        'z-[1]' // Below content but above background
      )}
      data-testid="halloween-overlay-container"
      aria-hidden="true"
    >
      {/* Render overlay components based on activeOverlays */}
      <FogLayerOverlay
        intensity={themeLayer.intensity * 0.6}
        isActive={themeLayer.effectsEnabled}
      />
      <FloatingParticlesOverlay
        intensity={themeLayer.intensity * 0.5}
        isActive={themeLayer.effectsEnabled}
      />
      <VignetteOverlay
        intensity={themeLayer.intensity * 0.7}
        isActive={themeLayer.effectsEnabled}
      />
      <SpiderWebOverlay
        intensity={themeLayer.intensity * 0.4}
        isActive={themeLayer.effectsEnabled}
      />
      <FloatingGhostsOverlay
        intensity={themeLayer.intensity * 0.3}
        isActive={themeLayer.effectsEnabled}
      />
      <CandleGlowOverlay
        intensity={themeLayer.intensity * 0.5}
        isActive={themeLayer.effectsEnabled}
      />
    </div>
  )

  // Use portal to render at document body level
  if (typeof document !== 'undefined') {
    return createPortal(overlayContent, document.body)
  }

  return null
})

/**
 * Halloween candle flicker animation keyframes
 * (Add to globals.css or halloween effects.css)
 */
const additionalStyles = `
@keyframes mistCrawl {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}

@keyframes halloweenCandleFlicker {
  0%, 100% { opacity: 1; }
  25% { opacity: 0.8; }
  50% { opacity: 0.95; }
  75% { opacity: 0.85; }
}

.animate-halloween-candle-flicker {
  animation: halloweenCandleFlicker 3s ease-in-out infinite;
}
`

export default HalloweenOverlay
