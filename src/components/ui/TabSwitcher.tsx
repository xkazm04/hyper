'use client'

import { ReactNode, useId } from 'react'
import { cn } from '@/lib/utils'
import { motion, LayoutGroup } from 'framer-motion'

export interface TabItem<T extends string = string> {
  id: T
  label: string
  icon?: ReactNode
}

interface TabSwitcherProps<T extends string = string> {
  tabs: TabItem<T>[]
  activeTab: T
  onTabChange: (tab: T) => void
  className?: string
  variant?: 'default' | 'pills' | 'underline'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
}

/**
 * Unified TabSwitcher component with consistent styling across the app
 *
 * Features:
 * - Active tab has filled background with smooth transition
 * - Inactive tabs are slightly transparent with hover effects
 * - Animated underline indicator for 'underline' variant
 * - Support for icons alongside labels
 */
export function TabSwitcher<T extends string = string>({
  tabs,
  activeTab,
  onTabChange,
  className,
  variant = 'default',
  size = 'md',
  fullWidth = true,
}: TabSwitcherProps<T>) {
  // Generate unique ID for this instance to prevent layoutId conflicts
  const instanceId = useId()

  const sizeClasses = {
    sm: 'py-1.5 px-3 text-xs gap-1.5',
    md: 'py-2.5 px-4 text-sm gap-2',
    lg: 'py-3 px-5 text-base gap-2.5',
  }

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  }

  if (variant === 'pills') {
    return (
      <LayoutGroup id={`pills-${instanceId}`}>
        <div className={cn('flex gap-2 p-1 bg-muted/50 rounded-lg', className)}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center justify-center font-medium rounded-md transition-colors duration-200',
                  sizeClasses[size],
                  fullWidth && 'flex-1',
                  isActive
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="pill-bg"
                    className="absolute inset-0 bg-primary rounded-md shadow-sm"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon && (
                    <span className={cn(iconSizes[size], 'shrink-0')}>
                      {tab.icon}
                    </span>
                  )}
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>
      </LayoutGroup>
    )
  }

  if (variant === 'underline') {
    return (
      <LayoutGroup id={`underline-${instanceId}`}>
        <div className={cn('flex border-b border-border', className)}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  'relative flex items-center justify-center font-medium border-b-2 -mb-px transition-colors duration-200',
                  sizeClasses[size],
                  fullWidth && 'flex-1',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
              >
                {tab.icon && (
                  <span className={cn(iconSizes[size], 'shrink-0')}>
                    {tab.icon}
                  </span>
                )}
                {tab.label}
                {isActive && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            )
          })}
        </div>
      </LayoutGroup>
    )
  }

  // Default variant - filled tabs with distinct active styling
  return (
    <div className={cn('flex bg-card border-b-2 border-border', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'relative flex items-center justify-center font-medium transition-all duration-200 border-b-2 -mb-[2px]',
              sizeClasses[size],
              fullWidth && 'flex-1'
            )}
            style={isActive ? {
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              borderColor: 'hsl(var(--primary))',
            } : {
              backgroundColor: 'transparent',
              color: 'hsl(var(--muted-foreground) / 0.7)',
              borderColor: 'transparent',
            }}
            data-active={isActive}
          >
            {tab.icon && (
              <span className={cn(iconSizes[size], 'shrink-0')}>
                {tab.icon}
              </span>
            )}
            <span className={cn(!isActive && 'opacity-80')}>{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

