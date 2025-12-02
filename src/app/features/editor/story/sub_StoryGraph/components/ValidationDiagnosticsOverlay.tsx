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
  Wrench,
  ArrowRight,
  MapPin,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import {
  ValidationResult,
  ValidationIssue,
  ValidationSeverity,
  FixAction,
} from '../hooks/useGraphValidation'

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

interface SeverityBadgeProps {
  severity: ValidationSeverity
  count?: number
}

function SeverityBadge({ severity, count }: SeverityBadgeProps) {
  const config = {
    error: {
      icon: AlertCircle,
      bg: 'bg-red-500/20',
      border: 'border-red-500/50',
      text: 'text-red-500',
      label: 'Errors',
    },
    warning: {
      icon: AlertTriangle,
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/50',
      text: 'text-amber-500',
      label: 'Warnings',
    },
    info: {
      icon: Info,
      bg: 'bg-blue-500/20',
      border: 'border-blue-500/50',
      text: 'text-blue-400',
      label: 'Info',
    },
  }[severity]

  const Icon = config.icon

  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border ${config.bg} ${config.border}`}
      data-testid={`severity-badge-${severity}`}
    >
      <Icon className={`w-3.5 h-3.5 ${config.text}`} />
      {count !== undefined && (
        <span className={`text-xs font-semibold ${config.text}`}>{count}</span>
      )}
    </div>
  )
}

interface IssueCardProps {
  issue: ValidationIssue
  onApplyFix: (action: FixAction) => void
  onNavigateToCard: (cardId: string) => void
}

function IssueCard({ issue, onApplyFix, onNavigateToCard }: IssueCardProps) {
  const severityConfig = {
    error: {
      border: 'border-l-red-500',
      bg: 'hover:bg-red-500/5',
    },
    warning: {
      border: 'border-l-amber-500',
      bg: 'hover:bg-amber-500/5',
    },
    info: {
      border: 'border-l-blue-500',
      bg: 'hover:bg-blue-500/5',
    },
  }[issue.severity]

  const handleFixClick = useCallback(() => {
    if (issue.fix) {
      onApplyFix(issue.fix.action)
    }
  }, [issue.fix, onApplyFix])

  const handleNavigate = useCallback(() => {
    if (issue.cardId) {
      onNavigateToCard(issue.cardId)
    }
  }, [issue.cardId, onNavigateToCard])

  const getFixIcon = () => {
    if (!issue.fix) return null
    switch (issue.fix.type) {
      case 'auto':
        return <Sparkles className="w-3 h-3" />
      case 'navigate':
        return <ArrowRight className="w-3 h-3" />
      case 'manual':
        return <Wrench className="w-3 h-3" />
    }
  }

  return (
    <div
      className={`p-3 bg-card/50 rounded-lg border-l-4 ${severityConfig.border} ${severityConfig.bg} transition-colors`}
      data-testid={`issue-card-${issue.id}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <SeverityBadge severity={issue.severity} />
            <h4 className="text-sm font-semibold text-foreground truncate">{issue.title}</h4>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">{issue.message}</p>
        </div>

        {issue.cardId && (
          <button
            onClick={handleNavigate}
            className="shrink-0 p-1.5 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Go to scene"
            data-testid={`issue-navigate-${issue.id}`}
          >
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {issue.fix && (
        <button
          onClick={handleFixClick}
          className="mt-2 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 transition-colors w-full justify-center"
          data-testid={`issue-fix-${issue.id}`}
        >
          {getFixIcon()}
          {issue.fix.label}
        </button>
      )}
    </div>
  )
}

interface SummaryHeaderProps {
  stats: ValidationResult['stats']
  isValid: boolean
  isExpanded: boolean
  onToggleExpand: () => void
}

function SummaryHeader({ stats, isValid, isExpanded, onToggleExpand }: SummaryHeaderProps) {
  const hasIssues = stats.errorsCount + stats.warningsCount + stats.infosCount > 0

  return (
    <button
      onClick={onToggleExpand}
      className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors rounded-t-lg"
      data-testid="validation-summary-header"
    >
      <div className="flex items-center gap-3">
        {isValid && !hasIssues ? (
          <>
            <div className="p-1.5 rounded-full bg-emerald-500/20">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-sm font-semibold text-emerald-500">All checks passed</span>
          </>
        ) : (
          <>
            <div className="p-1.5 rounded-full bg-muted">
              <AlertCircle className="w-4 h-4 text-foreground" />
            </div>
            <div className="flex items-center gap-2">
              {stats.errorsCount > 0 && (
                <SeverityBadge severity="error" count={stats.errorsCount} />
              )}
              {stats.warningsCount > 0 && (
                <SeverityBadge severity="warning" count={stats.warningsCount} />
              )}
              {stats.infosCount > 0 && (
                <SeverityBadge severity="info" count={stats.infosCount} />
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex items-center gap-2 text-muted-foreground">
        <span className="text-xs">
          {stats.reachableCards}/{stats.totalCards} reachable
        </span>
        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
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
    <Panel
      position="bottom-left"
      className="w-80 max-h-[70vh] overflow-hidden"
    >
      <div
        className="bg-card/95 border-2 border-border rounded-lg shadow-lg backdrop-blur-sm flex flex-col"
        data-testid="validation-diagnostics-overlay"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border bg-muted/30">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Graph Diagnostics</h3>
          </div>
          <button
            onClick={onToggleVisibility}
            className="p-1 rounded-md hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
            title="Close diagnostics"
            data-testid="validation-close-btn"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary */}
        <SummaryHeader
          stats={stats}
          isValid={isValid}
          isExpanded={isExpanded}
          onToggleExpand={toggleExpand}
        />

        {/* Expanded Issue List */}
        {isExpanded && hasIssues && (
          <>
            {/* Filter Tabs */}
            <div className="flex items-center gap-1 px-3 pb-2 border-b border-border">
              <FilterTab
                label="All"
                count={issues.length}
                isActive={severityFilter === 'all'}
                onClick={() => setSeverityFilter('all')}
              />
              {stats.errorsCount > 0 && (
                <FilterTab
                  label="Errors"
                  count={stats.errorsCount}
                  isActive={severityFilter === 'error'}
                  onClick={() => setSeverityFilter('error')}
                  severity="error"
                />
              )}
              {stats.warningsCount > 0 && (
                <FilterTab
                  label="Warnings"
                  count={stats.warningsCount}
                  isActive={severityFilter === 'warning'}
                  onClick={() => setSeverityFilter('warning')}
                  severity="warning"
                />
              )}
              {stats.infosCount > 0 && (
                <FilterTab
                  label="Info"
                  count={stats.infosCount}
                  isActive={severityFilter === 'info'}
                  onClick={() => setSeverityFilter('info')}
                  severity="info"
                />
              )}
            </div>

            {/* Issue List */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2 max-h-[40vh]">
              {filteredIssues.map((issue) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onApplyFix={onApplyFix}
                  onNavigateToCard={onNavigateToCard}
                />
              ))}
            </div>
          </>
        )}

        {/* Empty state when expanded but no issues */}
        {isExpanded && !hasIssues && (
          <div className="p-6 text-center">
            <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              Your story graph looks great!
            </p>
          </div>
        )}
      </div>
    </Panel>
  )
}

// ============================================================================
// Filter Tab Component
// ============================================================================

interface FilterTabProps {
  label: string
  count: number
  isActive: boolean
  onClick: () => void
  severity?: ValidationSeverity
}

function FilterTab({ label, count, isActive, onClick, severity }: FilterTabProps) {
  const getColorClass = () => {
    if (!severity) return 'text-foreground'
    return {
      error: 'text-red-500',
      warning: 'text-amber-500',
      info: 'text-blue-400',
    }[severity]
  }

  return (
    <button
      onClick={onClick}
      className={`px-2 py-1 text-xs font-medium rounded-md transition-colors ${
        isActive
          ? 'bg-primary/20 text-primary border border-primary/30'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
      }`}
      data-testid={`filter-tab-${severity || 'all'}`}
    >
      <span className={isActive ? '' : getColorClass()}>
        {label} ({count})
      </span>
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
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border-2 transition-all backdrop-blur-sm ${
          hasIssues
            ? 'bg-card/95 border-amber-500/50 hover:border-amber-500 shadow-md'
            : 'bg-card/95 border-border hover:border-primary/50 shadow-sm'
        }`}
        title="Show diagnostics"
        data-testid="validation-toggle-btn"
      >
        {isValid && !hasIssues ? (
          <CheckCircle className="w-4 h-4 text-emerald-500" />
        ) : stats.errorsCount > 0 ? (
          <AlertCircle className="w-4 h-4 text-red-500" />
        ) : stats.warningsCount > 0 ? (
          <AlertTriangle className="w-4 h-4 text-amber-500" />
        ) : (
          <Info className="w-4 h-4 text-blue-400" />
        )}

        <span className="text-xs font-medium text-foreground">
          {stats.errorsCount + stats.warningsCount + stats.infosCount > 0
            ? `${stats.errorsCount + stats.warningsCount + stats.infosCount} issues`
            : 'Valid'}
        </span>
      </button>
    </Panel>
  )
}
