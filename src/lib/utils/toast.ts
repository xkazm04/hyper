import { toast as sonnerToast } from 'sonner'

/**
 * Toast notification utility wrapper for consistent error and success messaging
 */
export const toast = {
  success: (message: string) => {
    sonnerToast.success(message)
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
    })
  },
  info: (message: string) => {
    sonnerToast.info(message)
  },
  warning: (message: string) => {
    sonnerToast.warning(message)
  },
}
