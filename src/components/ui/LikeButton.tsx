'use client'

import * as React from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"
import { HeartBurstAnimation } from "./HeartBurstAnimation"
import { motion } from "framer-motion"

export interface LikeButtonProps {
  initialLikeCount: number
  initialLiked?: boolean
  stackId: string
  onLike?: (stackId: string, liked: boolean) => Promise<void>
  onLikeSuccess?: (message: string) => void
  className?: string
}

export function LikeButton({
  initialLikeCount,
  initialLiked = false,
  stackId,
  onLike,
  onLikeSuccess,
  className,
}: LikeButtonProps) {
  const [liked, setLiked] = React.useState(initialLiked)
  const [likeCount, setLikeCount] = React.useState(initialLikeCount)
  const [showBurst, setShowBurst] = React.useState(false)
  const [isAnimating, setIsAnimating] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault() // Prevent navigation if inside a link
    e.stopPropagation() // Stop event bubbling

    if (isProcessing || isAnimating) return

    const newLikedState = !liked
    const previousLiked = liked
    const previousCount = likeCount

    // Optimistic update
    setLiked(newLikedState)
    setLikeCount((prev) => (newLikedState ? prev + 1 : prev - 1))

    // Trigger animations only when liking
    if (newLikedState) {
      setIsAnimating(true)
      setShowBurst(true)

      // Show success toast
      if (onLikeSuccess) {
        onLikeSuccess(newLikedState ? "Stack liked!" : "Like removed")
      }
    }

    // Call the API
    if (onLike) {
      setIsProcessing(true)
      try {
        await onLike(stackId, newLikedState)
      } catch (error) {
        // Rollback on error
        console.error("Failed to update like:", error)
        setLiked(previousLiked)
        setLikeCount(previousCount)

        if (onLikeSuccess) {
          onLikeSuccess("Failed to update like. Please try again.")
        }
      } finally {
        setIsProcessing(false)
      }
    }
  }

  const handleBurstComplete = () => {
    setShowBurst(false)
    setIsAnimating(false)
  }

  return (
    <motion.button
      onClick={handleClick}
      disabled={isProcessing}
      className={cn(
        "relative flex items-center gap-1.5 px-3 py-1.5 rounded-md",
        "border-2 border-black transition-all",
        "hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px]",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        "focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2",
        liked ? "bg-red-100" : "bg-white",
        className
      )}
      whileTap={!isProcessing ? { scale: 0.95 } : {}}
      data-testid="like-button"
      aria-label={liked ? "Unlike stack" : "Like stack"}
      aria-pressed={liked}
    >
      {/* Heart Icon */}
      <motion.div
        animate={
          liked
            ? {
                scale: [1, 1.3, 1],
              }
            : {}
        }
        transition={{ duration: 0.3 }}
      >
        <Heart
          className={cn(
            "w-4 h-4 transition-colors",
            liked ? "fill-red-500 text-red-500" : "text-gray-600"
          )}
          aria-hidden="true"
        />
      </motion.div>

      {/* Like Count */}
      <motion.span
        key={likeCount}
        initial={liked && isAnimating ? { scale: 1.3, opacity: 0.5 } : false}
        animate={{ scale: 1, opacity: 1 }}
        className="text-sm font-mono font-semibold"
        data-testid="like-count"
      >
        {likeCount}
      </motion.span>

      {/* Heart Burst Animation */}
      {showBurst && (
        <HeartBurstAnimation isActive={showBurst} onComplete={handleBurstComplete} />
      )}
    </motion.button>
  )
}
