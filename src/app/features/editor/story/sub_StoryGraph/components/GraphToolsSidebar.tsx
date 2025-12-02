'use client'

import { useState, useCallback, memo } from 'react'
import { cn } from '@/lib/utils'
import { usePerformanceOptional } from '@/contexts/PerformanceContext'
import {
  Zap,
  ZapOff,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { ValidationResult } from '../hooks/useGraphValidation'
import Image from 'next/image'

// ============================================================================
// Types
// ============================================================================

export interface GraphToolsSidebarProps {
  validationResult: ValidationResult
  isValidationVisible: boolean
  onToggleValidation: () => void
  onExport: () => void
  onImportClick: () => void
  isExporting?: boolean
  isImporting?: boolean
  isHalloween?: boolean
}

// ============================================================================
// Sub-components
// ============================================================================

interface ToolButtonProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  isActive?: boolean
  variant?: 'default' | 'success' | 'warning' | 'danger'
  disabled?: boolean
  isHalloween?: boolean
}

const ToolButton = memo(function ToolButton({
  icon,
  label,
  onClick,
  isActive,
  variant = 'default',
  disabled,
  isHalloween,
}: ToolButtonProps) {
  const variantStyles = {
    default: isActive
      ? 'bg-primary/20 text-primary border-primary/50'
      : 'hover:bg-muted/80 text-muted-foreground hover:text-foreground border-transparent',
    success: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50',
    warning: 'bg-amber-500/20 text-amber-500 border-amber-500/50',
    danger: 'bg-red-500/20 text-red-500 border-red-500/50',
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-10 h-10 flex items-center justify-center rounded-lg border-2 transition-all',
        variantStyles[variant],
        disabled && 'opacity-50 cursor-not-allowed',
        isHalloween && isActive && 'border-orange-500/50 bg-orange-500/20 text-orange-400'
      )}
      title={label}
      aria-label={label}
      aria-pressed={isActive}
    >
      {icon}
    </button>
  )
})

// ============================================================================
// Main Component
// ============================================================================

export const GraphToolsSidebar = memo(function GraphToolsSidebar({
  validationResult,
  isValidationVisible,
  onToggleValidation,
  onExport,
  onImportClick,
  isExporting,
  isImporting,
  isHalloween,
}: GraphToolsSidebarProps) {
  const { toggleLowPower, showHeavyAnimations } = usePerformanceOptional()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const toggleCollapse = useCallback(() => {
    setIsCollapsed(prev => !prev)
  }, [])

  const { stats, isValid } = validationResult
  const hasValidationIssues = stats.errorsCount + stats.warningsCount > 0

  // Determine validation button variant
  const getValidationVariant = () => {
    if (stats.errorsCount > 0) return 'danger'
    if (stats.warningsCount > 0) return 'warning'
    if (isValid) return 'success'
    return 'default'
  }

  const getValidationIcon = () => {
    if (stats.errorsCount > 0) return <AlertTriangle className="w-5 h-5" />
    if (stats.warningsCount > 0) return <AlertTriangle className="w-5 h-5" />
    return <CheckCircle className="w-5 h-5" />
  }

  const validationLabel = hasValidationIssues
    ? `Validation: ${stats.errorsCount + stats.warningsCount} issues`
    : 'Validation: All checks passed'

  return (
    <div className="flex items-start gap-0" data-testid="graph-tools-sidebar-wrapper">
      {/* Collapse/Expand Toggle */}
      <button
        onClick={toggleCollapse}
        className={cn(
          'w-6 h-10 flex items-center justify-center rounded-l-lg border-2 border-r-0 transition-all',
          'bg-card/95 border-border hover:bg-muted/80 text-muted-foreground hover:text-foreground',
          isHalloween && 'hover:border-orange-500/30'
        )}
        title={isCollapsed ? 'Expand tools' : 'Collapse tools'}
        aria-label={isCollapsed ? 'Expand tools' : 'Collapse tools'}
      >
        {isCollapsed ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>

      {/* Sidebar Panel */}
      <div
        className={cn(
          'bg-card/95 border-2 border-border rounded-lg shadow-lg backdrop-blur-sm transition-all duration-200',
          isCollapsed ? 'w-0 overflow-hidden opacity-0' : 'w-14 p-2',
          isHalloween && 'border-orange-500/30'
        )}
        data-testid="graph-tools-sidebar"
      >
        <div className="flex flex-col gap-2 items-center">
          {/* Performance Toggle */}
          <ToolButton
            icon={showHeavyAnimations ? <Zap className="w-5 h-5" /> : <ZapOff className="w-5 h-5" />}
            label={showHeavyAnimations ? 'Effects: On' : 'Effects: Off'}
            onClick={toggleLowPower}
            isActive={showHeavyAnimations}
            isHalloween={isHalloween}
          />

          {/* Divider */}
          <div className="w-8 h-px bg-border" />

          {/* Export Button */}
          <ToolButton
            icon={<Download className="w-5 h-5" />}
            label="Export to JSON"
            onClick={onExport}
            disabled={isExporting}
            isHalloween={isHalloween}
          />

          {/* Import Button */}
          <ToolButton
            icon={<Upload className="w-5 h-5" />}
            label="Import from JSON"
            onClick={onImportClick}
            disabled={isImporting}
            isHalloween={isHalloween}
          />

          {/* Divider */}
          <div className="w-8 h-px bg-border" />

          {/* Validation Toggle */}
          <ToolButton
            icon={getValidationIcon()}
            label={validationLabel}
            onClick={onToggleValidation}
            isActive={isValidationVisible}
            variant={getValidationVariant()}
            isHalloween={isHalloween}
          />
        </div>
      </div>
    </div>
  )
})

// ============================================================================
// Decorative Pumpkin Overlay (shown when effects are ON)
// ============================================================================

export interface PumpkinOverlayProps {
  visible: boolean
}

export const PumpkinOverlay = memo(function PumpkinOverlay({ visible }: PumpkinOverlayProps) {
  if (!visible) return null

  return (
    <div
      className="absolute inset-0 flex items-center justify-center pointer-events-none z-0"
      data-testid="pumpkin-overlay"
    >
      <div className="opacity-10 animate-pulse">
        <Image
          src="/decorative/pumpkin.svg"
          alt=""
          width={200}
          height={200}
          priority={false}
          aria-hidden="true"
        />
      </div>
    </div>
  )
})

export default GraphToolsSidebar
