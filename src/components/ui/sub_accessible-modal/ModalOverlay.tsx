"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

// Animation variants for overlay
export const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

interface ModalOverlayProps {
  className?: string
  testId?: string
  closeOnOverlayClick?: boolean
  onClose: () => void
}

/**
 * ModalOverlay - Backdrop overlay with blur effect and halloween-ghost-float animation
 */
export const ModalOverlay = React.forwardRef<HTMLDivElement, ModalOverlayProps>(
  ({ className, testId, closeOnOverlayClick = true, onClose }, ref) => {
    return (
      <DialogPrimitive.Overlay forceMount asChild>
        <motion.div
          ref={ref}
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/60 backdrop-blur-sm",
            "dark:bg-black/80",
            className
          )}
          data-testid={testId || "modal-overlay"}
          onClick={closeOnOverlayClick ? onClose : undefined}
        />
      </DialogPrimitive.Overlay>
    )
  }
)

ModalOverlay.displayName = "ModalOverlay"
