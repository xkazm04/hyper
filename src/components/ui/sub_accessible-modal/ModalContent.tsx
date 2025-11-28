"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ModalContentProps extends React.HTMLAttributes<HTMLDivElement> {
  testId?: string
}

/**
 * ModalContent - Body content area of the modal
 */
export function ModalContent({
  children,
  className,
  testId,
  ...props
}: ModalContentProps) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto", className)}
      data-testid={testId || "modal-body"}
      {...props}
    >
      {children}
    </div>
  )
}

/**
 * ModalBody - Alias for ModalContent for backward compatibility
 */
export function ModalBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex-1", className)} {...props} />
}

ModalBody.displayName = "ModalBody"
