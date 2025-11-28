"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface ModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  testId?: string
}

/**
 * ModalFooter - Action buttons area at the bottom of the modal
 */
export function ModalFooter({
  children,
  className,
  testId,
  ...props
}: ModalFooterProps) {
  return (
    <div
      className={cn(
        "flex flex-col-reverse sm:flex-row",
        "sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0",
        className
      )}
      data-testid={testId || "modal-footer"}
      {...props}
    >
      {children}
    </div>
  )
}

ModalFooter.displayName = "ModalFooter"
