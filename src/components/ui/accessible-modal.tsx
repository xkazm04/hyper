"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// Types
export interface AccessibleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  children: React.ReactNode
  footer?: React.ReactNode
  className?: string
  overlayClassName?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
  "data-testid"?: string
}

// Size variants
const sizeVariants = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-full mx-4",
}

// Animation variants for Framer Motion
const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
}

const contentVariants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: -20
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      damping: 25,
      stiffness: 300,
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 20,
    transition: {
      duration: 0.2,
    }
  },
}

/**
 * AccessibleModal - A fully accessible modal component with focus trap, ARIA support, and animations
 *
 * Features:
 * - Focus trap (via Radix UI)
 * - Escape key handling
 * - ARIA labeling (aria-labelledby, aria-describedby)
 * - Dark mode support
 * - Framer Motion transitions
 * - Keyboard navigation
 * - Screen reader support
 *
 * @example
 * ```tsx
 * <AccessibleModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Confirm Action"
 *   description="Are you sure you want to proceed?"
 *   footer={
 *     <>
 *       <Button onClick={() => setIsOpen(false)}>Cancel</Button>
 *       <Button onClick={handleConfirm}>Confirm</Button>
 *     </>
 *   }
 * >
 *   <p>Modal content goes here</p>
 * </AccessibleModal>
 * ```
 */
export const AccessibleModal = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  AccessibleModalProps
>(
  (
    {
      open,
      onOpenChange,
      title,
      description,
      children,
      footer,
      className,
      overlayClassName,
      size = "md",
      showCloseButton = true,
      closeOnEscape = true,
      closeOnOverlayClick = true,
      "data-testid": testId,
      ...props
    },
    ref
  ) => {
    return (
      <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
        <AnimatePresence mode="wait">
          {open && (
            <DialogPrimitive.Portal forceMount>
              {/* Backdrop/Overlay */}
              <DialogPrimitive.Overlay forceMount asChild>
                <motion.div
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "fixed inset-0 z-50",
                    "bg-black/60 backdrop-blur-sm",
                    "dark:bg-black/80",
                    overlayClassName
                  )}
                  data-testid={testId ? `${testId}-overlay` : "modal-overlay"}
                  onClick={
                    closeOnOverlayClick
                      ? () => onOpenChange(false)
                      : undefined
                  }
                />
              </DialogPrimitive.Overlay>

              {/* Modal Content */}
              <DialogPrimitive.Content
                ref={ref}
                forceMount
                asChild
                onEscapeKeyDown={
                  closeOnEscape
                    ? undefined
                    : (e) => e.preventDefault()
                }
                aria-describedby={description ? undefined : undefined}
                {...props}
              >
                <motion.div
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  className={cn(
                    "fixed left-[50%] top-[50%] z-50",
                    "translate-x-[-50%] translate-y-[-50%]",
                    "w-full",
                    sizeVariants[size],
                    "grid gap-4",
                    "border-4 border-black",
                    "bg-white dark:bg-gray-900",
                    "p-6",
                    "shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]",
                    "dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,0.1)]",
                    "rounded-none",
                    "focus:outline-none",
                    className
                  )}
                  data-testid={testId || "accessible-modal"}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header */}
                  <div className="flex flex-col space-y-2">
                    <DialogPrimitive.Title
                      className={cn(
                        "text-xl font-bold leading-none tracking-tight",
                        "text-black dark:text-white"
                      )}
                      data-testid={testId ? `${testId}-title` : "modal-title"}
                    >
                      {title}
                    </DialogPrimitive.Title>
                    {description && (
                      <DialogPrimitive.Description
                        className={cn(
                          "text-sm text-gray-600 dark:text-gray-400"
                        )}
                        data-testid={
                          testId
                            ? `${testId}-description`
                            : "modal-description"
                        }
                      >
                        {description}
                      </DialogPrimitive.Description>
                    )}
                  </div>

                  {/* Body */}
                  <div
                    className="flex-1 overflow-y-auto"
                    data-testid={testId ? `${testId}-body` : "modal-body"}
                  >
                    {children}
                  </div>

                  {/* Footer */}
                  {footer && (
                    <div
                      className={cn(
                        "flex flex-col-reverse sm:flex-row",
                        "sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0"
                      )}
                      data-testid={testId ? `${testId}-footer` : "modal-footer"}
                    >
                      {footer}
                    </div>
                  )}

                  {/* Close Button */}
                  {showCloseButton && (
                    <DialogPrimitive.Close
                      className={cn(
                        "absolute right-4 top-4",
                        "rounded-sm",
                        "opacity-70 hover:opacity-100",
                        "transition-opacity",
                        "focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2",
                        "dark:focus:ring-white dark:focus:ring-offset-gray-900",
                        "disabled:pointer-events-none",
                        "text-black dark:text-white"
                      )}
                      aria-label="Close modal"
                      data-testid={
                        testId ? `${testId}-close-btn` : "modal-close-btn"
                      }
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </DialogPrimitive.Close>
                  )}
                </motion.div>
              </DialogPrimitive.Content>
            </DialogPrimitive.Portal>
          )}
        </AnimatePresence>
      </DialogPrimitive.Root>
    )
  }
)

AccessibleModal.displayName = "AccessibleModal"

// Export helper components for composability
export const ModalHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn("flex flex-col space-y-1.5", className)}
    {...props}
  />
)
ModalHeader.displayName = "ModalHeader"

export const ModalBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex-1", className)} {...props} />
)
ModalBody.displayName = "ModalBody"

export const ModalFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
      className
    )}
    {...props}
  />
)
ModalFooter.displayName = "ModalFooter"

// Confirmation Modal Variant
export interface ConfirmationModalProps extends Omit<AccessibleModalProps, "footer" | "children"> {
  message: string
  confirmText?: string
  cancelText?: string
  confirmVariant?: "default" | "destructive"
  onConfirm: () => void
  onCancel?: () => void
  isLoading?: boolean
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
  ...modalProps
}) => {
  const handleConfirm = () => {
    onConfirm()
    if (!isLoading) {
      modalProps.onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    modalProps.onOpenChange(false)
  }

  return (
    <AccessibleModal
      {...modalProps}
      footer={
        <>
          <button
            onClick={handleCancel}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-md",
              "border-2 border-black",
              "bg-white hover:bg-gray-100",
              "dark:bg-gray-800 dark:hover:bg-gray-700",
              "dark:border-white",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
            data-testid={`${modalProps["data-testid"]}-cancel-btn`}
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className={cn(
              "px-4 py-2 rounded-md",
              "border-2 border-black",
              "transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              confirmVariant === "destructive"
                ? "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700"
                : "bg-black hover:bg-gray-800 text-white dark:bg-white dark:hover:bg-gray-200 dark:text-black"
            )}
            data-testid={`${modalProps["data-testid"]}-confirm-btn`}
          >
            {isLoading ? "Loading..." : confirmText}
          </button>
        </>
      }
    >
      <p className="text-gray-700 dark:text-gray-300">{message}</p>
    </AccessibleModal>
  )
}
