"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { cn } from "@/lib/utils"

interface ModalHeaderProps {
  title: string
  description?: string
  testId?: string
}

/**
 * ModalHeader - Title and description section of the modal
 */
export function ModalHeader({ title, description, testId }: ModalHeaderProps) {
  return (
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
          className={cn("text-sm text-gray-600 dark:text-gray-400")}
          data-testid={testId ? `${testId}-description` : "modal-description"}
        >
          {description}
        </DialogPrimitive.Description>
      )}
    </div>
  )
}

/**
 * ModalHeaderContainer - Wrapper for custom header content
 */
export function ModalHeaderContainer({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("flex flex-col space-y-1.5", className)} {...props} />
  )
}

ModalHeaderContainer.displayName = "ModalHeaderContainer"
