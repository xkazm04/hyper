"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

// ============================================================================
// Modal - A themed modal component with solid background
// ============================================================================

export interface ModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg" | "xl" | "full"
  showCloseButton?: boolean
  closeOnEscape?: boolean
  closeOnOverlayClick?: boolean
}

const sizeVariants = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-[90vw]",
}

export function Modal({
  open,
  onOpenChange,
  children,
  className,
  size = "md",
  showCloseButton = true,
  closeOnEscape = true,
  closeOnOverlayClick = true,
}: ModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        {/* Overlay */}
        <DialogPrimitive.Overlay
          className={cn(
            "fixed inset-0 z-50",
            "bg-black/70",
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0"
          )}
          onClick={closeOnOverlayClick ? () => onOpenChange(false) : undefined}
        />

        {/* Content */}
        <DialogPrimitive.Content
          onEscapeKeyDown={closeOnEscape ? undefined : (e) => e.preventDefault()}
          onPointerDownOutside={closeOnOverlayClick ? undefined : (e) => e.preventDefault()}
          className={cn(
            "fixed left-[50%] top-[50%] z-50",
            "translate-x-[-50%] translate-y-[-50%]",
            "w-full",
            sizeVariants[size],
            // Solid background using theme variables
            "bg-card text-card-foreground",
            // Border and shadow
            "border-4 border-border",
            "shadow-[8px_8px_0px_0px_hsl(var(--border))]",
            // Layout
            "p-6 rounded-none",
            // Animation
            "data-[state=open]:animate-in data-[state=closed]:animate-out",
            "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
            "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            "data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%]",
            "data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]",
            "duration-200",
            // Focus
            "focus:outline-none",
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {children}

          {/* Close Button */}
          {showCloseButton && (
            <DialogPrimitive.Close
              className={cn(
                "absolute right-4 top-4",
                "rounded-sm",
                "opacity-70 hover:opacity-100",
                "transition-opacity",
                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                "disabled:pointer-events-none",
                "text-foreground"
              )}
              aria-label="Close modal"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </DialogPrimitive.Close>
          )}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

// ============================================================================
// Modal Sub-components
// ============================================================================

export function ModalHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}
      {...props}
    />
  )
}

export function ModalTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <DialogPrimitive.Title
      className={cn(
        "text-lg font-semibold leading-none tracking-tight text-foreground",
        className
      )}
      {...props}
    />
  )
}

export function ModalDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <DialogPrimitive.Description
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export function ModalBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("py-4", className)} {...props} />
}

export function ModalFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2",
        className
      )}
      {...props}
    />
  )
}

// ============================================================================
// Confirmation Modal - Pre-built variant for confirm/cancel dialogs
// ============================================================================

export interface ConfirmModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  message: React.ReactNode
  confirmText?: string
  cancelText?: string
  confirmVariant?: "default" | "destructive"
  onConfirm: () => void | Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  size?: "sm" | "md" | "lg"
}

export function ConfirmModal({
  open,
  onOpenChange,
  title,
  description,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "default",
  onConfirm,
  onCancel,
  isLoading = false,
  size = "sm",
}: ConfirmModalProps) {
  const handleConfirm = async () => {
    await onConfirm()
    if (!isLoading) {
      onOpenChange(false)
    }
  }

  const handleCancel = () => {
    onCancel?.()
    onOpenChange(false)
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} size={size}>
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        {description && <ModalDescription>{description}</ModalDescription>}
      </ModalHeader>

      <ModalBody>
        <div className="text-sm text-foreground">{message}</div>
      </ModalBody>

      <ModalFooter>
        <button
          onClick={handleCancel}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md",
            "border-2 border-border",
            "bg-background hover:bg-muted",
            "text-foreground",
            "transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {cancelText}
        </button>
        <button
          onClick={handleConfirm}
          disabled={isLoading}
          className={cn(
            "px-4 py-2 text-sm font-medium rounded-md",
            "border-2",
            "transition-colors",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            confirmVariant === "destructive"
              ? "bg-destructive hover:bg-destructive/90 text-destructive-foreground border-destructive"
              : "bg-primary hover:bg-primary/90 text-primary-foreground border-primary"
          )}
        >
          {isLoading ? "Loading..." : confirmText}
        </button>
      </ModalFooter>
    </Modal>
  )
}
