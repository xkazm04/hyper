'use client'

import React, { useState, useEffect } from 'react'
import { EasterEgg } from '@/lib/data/cardEasterEggs'

interface CardFlipEasterEggProps {
  easterEgg: EasterEgg
  isFlipped: boolean
  onFlipComplete?: () => void
}

/**
 * Easter egg component that displays when a card is flipped
 * Shows fun facts, quirky illustrations, or animations
 */
export function CardFlipEasterEgg({ easterEgg, isFlipped, onFlipComplete }: CardFlipEasterEggProps) {
  const [showConfetti, setShowConfetti] = useState(false)

  useEffect(() => {
    if (isFlipped && easterEgg.type === 'animation') {
      setShowConfetti(true)
      const timer = setTimeout(() => {
        setShowConfetti(false)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isFlipped, easterEgg.type])

  if (!isFlipped) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center p-8"
      style={{
        backgroundColor: easterEgg.backgroundColor || '#F0F0F0',
        backfaceVisibility: 'hidden',
        transform: 'rotateY(180deg)',
      }}
      data-testid="card-easter-egg"
    >
      <div className="text-center space-y-4 max-w-md">
        {/* Emoji/Icon */}
        {easterEgg.emoji && (
          <div
            className={`text-6xl ${showConfetti ? 'animate-bounce' : ''}`}
            data-testid="easter-egg-emoji"
          >
            {easterEgg.emoji}
          </div>
        )}

        {/* Content */}
        <div
          className="text-lg font-medium text-gray-800 leading-relaxed"
          style={{
            textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          }}
          data-testid="easter-egg-content"
        >
          {easterEgg.content}
        </div>

        {/* Type Badge */}
        <div className="text-xs uppercase tracking-wide text-gray-600 opacity-70">
          {easterEgg.type}
        </div>

        {/* Confetti animation for animation type */}
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="confetti-piece"
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  backgroundColor: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8'][i % 5],
                  left: `${Math.random() * 100}%`,
                  top: '-10px',
                  animation: `confetti-fall ${1 + Math.random() * 2}s linear forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                  transform: `rotate(${Math.random() * 360}deg)`,
                  opacity: 0.8,
                }}
              />
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes confetti-fall {
          to {
            transform: translateY(600px) rotate(360deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}
