'use client'

import { useTheme } from '@/contexts/ThemeContext'
import { HighContrastProvider } from './HighContrastContext'

interface HighContrastWrapperProps {
  children: React.ReactNode
}

/**
 * HighContrastWrapper
 *
 * Wraps children with HighContrastProvider, automatically passing the current theme.
 * This component bridges the ThemeContext and HighContrastProvider.
 */
export function HighContrastWrapper({ children }: HighContrastWrapperProps) {
  const { theme } = useTheme()

  return (
    <HighContrastProvider theme={theme}>
      {children}
    </HighContrastProvider>
  )
}
