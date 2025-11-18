'use client'

import * as React from "react"
import { Toast, ToastType } from "@/components/ui/toast"

interface ToastContextValue {
  toasts: Toast[]
  showToast: (message: string, type?: ToastType, duration?: number) => void
  hideToast: (id: string) => void
  success: (message: string, duration?: number) => void
  error: (message: string, duration?: number) => void
  warning: (message: string, duration?: number) => void
  info: (message: string, duration?: number) => void
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined)

let toastIdCounter = 0

function generateToastId(): string {
  return `toast-${Date.now()}-${++toastIdCounter}`
}

interface ToastProviderProps {
  children: React.ReactNode
  maxToasts?: number
}

export function ToastProvider({ children, maxToasts = 5 }: ToastProviderProps) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const showToast = React.useCallback(
    (message: string, type: ToastType = 'info', duration: number = 5000) => {
      const id = generateToastId()
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
      }

      setToasts((prev) => {
        const updated = [...prev, newToast]
        // Keep only the most recent toasts up to maxToasts
        if (updated.length > maxToasts) {
          return updated.slice(-maxToasts)
        }
        return updated
      })
    },
    [maxToasts]
  )

  const hideToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const success = React.useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'success', duration)
    },
    [showToast]
  )

  const error = React.useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'error', duration)
    },
    [showToast]
  )

  const warning = React.useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'warning', duration)
    },
    [showToast]
  )

  const info = React.useCallback(
    (message: string, duration?: number) => {
      showToast(message, 'info', duration)
    },
    [showToast]
  )

  const value = React.useMemo(
    () => ({
      toasts,
      showToast,
      hideToast,
      success,
      error,
      warning,
      info,
    }),
    [toasts, showToast, hideToast, success, error, warning, info]
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast(): ToastContextValue {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
