'use client'

import { useState, useCallback, useMemo } from 'react'
import { Panel } from 'reactflow'
import {
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  X,
  ExternalLink,
} from 'lucide-react'
import {
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  FixAction,
} from '../hooks/useGraphValidation'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface ValidationDiagnosticsOverlayProps {
  validationResult: ValidationResult
  onApplyFix: (action: FixAction) => void
  onNavigateToCard: (cardId: string) => void
  isVisible: boolean
  onToggleVisibility: () => void
}

// ============================================================================
// Sub-components
// ============================================================================

interface CompactIssueRowProps {
  issue: ValidationIssue
  onNavigateToCard: (cardId: string) => void
}

function CompactIssueRow({ issue, onNavigateToCard }: CompactIssueRowProps) {
  const severityConfig = {
    error: { icon: AlertCircle, color: 'text-red-500', dot: 'bg-red-500' },
    warning: { icon: AlertTriangle, color: 'text-amber-500', dot: 'bg-amber-500' },
    info: { icon: Info, color: 'text-blue-400', dot: 'bg-blue-400' },
  }[issue.severity]

  const handleNavigate = useCallback(() => {
    if (issue.cardId) {
      onNavigateToCard(issue.cardId)
    }
  }, [issue.cardId, onNavigateToCard])

  const Icon = severityConfig.icon

  return (
    <div
      className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-muted/50 transition-colors group"
      data-testid={`issue-row-${issue.id}`}
    >
      <Icon className={cn('w-3.5 h-3.5 shrink-0', severityConfig.color)} />
      <span className="flex-1 text-xs text-foreground truncate" title={issue.message}>
        {issue.title}
      </span>
      {issue.cardId && (
        <button
          onClick={handleNavigate}
          className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
          title="Go to scene"
          data-testid={`issue-goto-${issue.id}`}
        >
          <ExternalLink className="w-3 h-3" />
        </button>
      )}
    </div>
  )
}

interface CompactSummaryProps {
  stats: ValidationResult['stats']
  isValid: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}

function CompactSummary({ stats, isValid, isExpanded, onToggleExpand }: CompactSummaryProps) {
  const hasIssues = stats.errorsCount + stats.warningsCount + stats.infosCount > 0

  return (
    <button
      onClick={onToggleExpand}
      className="w-full flex items-center justify-between px-2 py-1.5 hover:bg-muted/50 transition-colors"
      data-testid="validation-summary"
    >
      <div className="flex items-center gap-2">
        {isValid && !hasIssues ? (
          <>
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-xs font-medium text-emerald-500">All good</span>
          </>
        ) : (
          <div className="flex items-center gap-1.5">
            {stats.errorsCount > 0 && (
              <div className="flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                <span className="text-xs font-semibold text-red-500">{stats.errorsCount}</span>
              </div>
            )}
            {stats.warningsCount > 0 && (
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-semibold text-amber-500">{stats.warningsCount}</span>
              </div>
            )}
            {stats.infosCount > 0 && (
              <div className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400">{stats.infosCount}</span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className="text-[10px]">
          {stats.reachableCards}/{stats.totalCards}
        </span>
        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
      </div>
    </button>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export function ValidationDiagnosticsOverlay({
  validationResult,
  onApplyFix,
  onNavigateToCard,
  isVisible,
  onToggleVisibility,
}: ValidationDiagnosticsOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [severityFilter, setSeverityFilter] = useState<ValidationSeverity | 'all'>('all')

  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => !prev)
  }, [])

  const filteredIssues = useMemo(() => {
    if (severityFilter === 'all') {
      return validationResult.issues
    }
    return validationResult.issues.filter((issue) => issue.severity === severityFilter)
  }, [validationResult.issues, severityFilter])

  // Don't render if not visible or no story cards
  if (!isVisible || validationResult.stats.totalCards === 0) {
    return null
  }

  const { stats, isValid, issues } = validationResult
  const hasIssues = issues.length > 0

  return (
    <Panel position="bottom-left" className="w-64 max-h-[50vh] overflow-hidden">
      <div
        className="bg-card/95 border border-border rounded-lg shadow-md backdrop-blur-sm flex flex-col"
        data-testid="validation-diagnostics-overlay"
      >
        {/* Compact Header */}
        <div className="flex items-center justify-between px-2 py-1 border-b border-border/50">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            Diagnostics
          </span>
          <button
            onClick={onToggleVisibility}
            className="p-0.5 rounded hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Close"
            data-testid="validation-close-btn"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Summary Row */}
        <CompactSummary
          stats={stats}
          isValid={isValid}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
        />

        {/* Expanded Issue List */}
        {isExpanded && hasIssues && (
          <>
            {/* Compact Filter Pills */}
            <div className="flex items-center gap-1 px-2 py-1 border-t border-border/50">
              <FilterPill
                label="All"
                count={issues.length}
                isActive={severityFilter === 'all'}
                onClick={() => setSeverityFilter('all')}
              />
              {stats.errorsCount > 0 && (
                <FilterPill
                  count={stats.errorsCount}
                  isActive={severityFilter === 'error'}
                  onClick={() => setSeverityFilter('error')}
                  severity="error"
                />
              )}
              {stats.warningsCount > 0 && (
                <FilterPill
                  count={stats.warningsCount}
                  isActive={severityFilter === 'warning'}
                  onClick={() => setSeverityFilter('warning')}
                  severity="warning"
                />
              )}
              {stats.infosCount > 0 && (
                <FilterPill
                  count={stats.infosCount}
                  isActive={severityFilter === 'info'}
                  onClick={() => setSeverityFilter('info')}
                  severity="info"
                />
              )}
            </div>

            {/* Compact Issue List */}
            <div className="flex-1 overflow-y-auto max-h-[30vh] divide-y divide-border/30">
              {filteredIssues.map((issue) => (
                <CompactIssueRow
                  key={issue.id}
                  issue={issue}
                  onNavigateToCard={onNavigateToCard}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state when expanded but no issues */}
        {isExpanded && !hasIssues && (
          <div className="py-3 text-center">
            <CheckCircle className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
            <p className="text-[10px] text-muted-foreground">Story graph is valid</p>
          </div>
        )}
      </div>
    </Panel>
  )
}

// ============================================================================
// Filter Pill Component
// ============================================================================

interface FilterPillProps {
  label?: string
  count: number
  isActive: boolean
  onClick: () => void
  severity?: ValidationSeverity
}

function FilterPill({ label, count, isActive, onClick, severity }: FilterPillProps) {
  const getColor = () => {
    if (!severity) return { text: 'text-foreground', bg: 'bg-muted' }
    return {
      error: { text: 'text-red-500', bg: 'bg-red-500/20' },
      warning: { text: 'text-amber-500', bg: 'bg-amber-500/20' },
      info: { text: 'text-blue-400', bg: 'bg-blue-400/20' },
    }[severity]
  }

  const colors = getColor()
  const Icon = severity ? {
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }[severity] : null

  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium rounded transition-colors',
        isActive
          ? 'bg-primary/20 text-primary'
          : cn('hover:bg-muted/50', severity ? colors.text : 'text-muted-foreground')
      )}
      data-testid={`filter-pill-${severity || 'all'}`}
    >
      {Icon && <Icon className="w-2.5 h-2.5" />}
      {label && <span>{label}</span>}
      <span>{count}</span>
    </button>
  )
}

// ============================================================================
// Compact Toggle Button (for collapsed state)
// ============================================================================

export interface ValidationToggleButtonProps {
  validationResult: ValidationResult
  isVisible: boolean
  onToggle: () => void
}

export function ValidationToggleButton({
  validationResult,
  isVisible,
  onToggle,
}: ValidationToggleButtonProps) {
  const { stats, isValid } = validationResult

  // Don't show if no cards or diagnostics is already visible
  if (stats.totalCards === 0 || isVisible) {
    return null
  }

  const hasIssues = stats.errorsCount + stats.warningsCount > 0

  return (
    <Panel position="bottom-left">
      <button
        onClick={onToggle}
        className={cn(
          'flex items-center gap-1.5 px-2 py-1.5 rounded-lg border transition-all backdrop-blur-sm text-xs',
          hasIssues
            ? 'bg-card/95 border-amber-500/50 hover:border-amber-500 shadow-sm'
            : 'bg-card/95 border-border hover:border-primary/50'
        )}
        title="Show diagnostics"
        data-testid="validation-toggle-btn"
      >
        {isValid && !hasIssues ? (
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
        ) : stats.errorsCount > 0 ? (
          <AlertCircle className="w-3.5 h-3.5 text-red-500" />
        ) : stats.warningsCount > 0 ? (
          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
        ) : (
          <Info className="w-3.5 h-3.5 text-blue-400" />
        )}

        <span className="font-medium text-foreground">
          {stats.errorsCount + stats.warningsCount + stats.infosCount > 0
            ? `${stats.errorsCount + stats.warningsCount + stats.infosCount}`
            : 'OK'}
        </span>
      </button>
    </Panel>
  )
}
