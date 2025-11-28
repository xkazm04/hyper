'use client'

import * as React from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle2, XCircle, AlertCircle, Info } from "lucide-react"
import { cn } from "@/lib/utils"

export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
}

interface ToastItemProps {
  toast: Toast
  onClose: (id: string) => void
}

const toastIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

const toastStyles = {
  success: "bg-[hsl(var(--green-50))] border-[hsl(var(--green-500)/0.3)] text-[hsl(var(--green-800))]",
  error: "bg-[hsl(var(--red-50))] border-[hsl(var(--red-500)/0.3)] text-[hsl(var(--red-600))]",
  warning: "bg-[hsl(var(--yellow-100))] border-[hsl(var(--yellow-500)/0.3)] text-foreground",
  info: "bg-[hsl(var(--blue-500)/0.1)] border-[hsl(var(--blue-500)/0.3)] text-foreground",
}

const iconStyles = {
  success: "text-[hsl(var(--green-600))]",
  error: "text-[hsl(var(--red-500))]",
  warning: "text-[hsl(var(--yellow-500))]",
  info: "text-[hsl(var(--blue-500))]",
}

export function ToastItem({ toast, onClose }: ToastItemProps) {
  const Icon = toastIcons[toast.type]

  React.useEffect(() => {
    const duration = toast.duration ?? 5000
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose(toast.id)
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [toast.id, toast.duration, onClose])

  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      className={cn(
        "flex items-start gap-3 rounded-md border-2 border-border p-4 shadow-theme-sm",
        "min-w-[320px] max-w-[420px]",
        toastStyles[toast.type]
      )}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-testid={`toast-${toast.type}`}
    >
      <Icon className={cn("h-5 w-5 flex-shrink-0 mt-0.5", iconStyles[toast.type])} aria-hidden="true" />

      <div className="flex-1 text-sm font-medium">
        {toast.message}
      </div>

      <button
        onClick={() => onClose(toast.id)}
        className={cn(
          "flex-shrink-0 rounded-md p-1 transition-colors",
          "hover:bg-black/10 dark:hover:bg-white/10",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          toast.type === 'success' && "focus:ring-green-500",
          toast.type === 'error' && "focus:ring-red-500",
          toast.type === 'warning' && "focus:ring-yellow-500",
          toast.type === 'info' && "focus:ring-blue-500"
        )}
        aria-label="Close notification"
        data-testid="toast-close-btn"
      >
        <X className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.div>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onClose: (id: string) => void
}

export function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  return (
    <div
      className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      aria-label="Notifications"
      data-testid="toast-container"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onClose={onClose} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
