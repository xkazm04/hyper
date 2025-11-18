'use client'

import { ToastProvider, useToast } from '@/lib/context/ToastContext'
import { ToastContainer } from './toast'

function ToastRenderer() {
  const { toasts, hideToast } = useToast()
  return <ToastContainer toasts={toasts} onClose={hideToast} />
}

export function ToasterProvider({ children }: { children?: React.ReactNode }) {
  return (
    <ToastProvider>
      {children}
      <ToastRenderer />
    </ToastProvider>
  )
}
