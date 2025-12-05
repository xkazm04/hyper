'use client'

import { useEffect, useRef } from 'react'
import { useOptimisticOperations, PendingOperation } from '@/contexts/EditorContext'
import { useToast } from '@/lib/context/ToastContext'
import { AlertTriangle, X, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

/**
 * Human-readable labels for operation types
 */
const OPERATION_LABELS: Record<PendingOperation['type'], string> = {
  add_card: 'Create card',
  update_card: 'Update card',
  delete_card: 'Delete card',
  add_choice: 'Create choice',
  update_choice: 'Update choice',
  delete_choice: 'Delete choice',
  add_character: 'Create character',
  update_character: 'Update character',
  delete_character: 'Delete character',
  add_character_card: 'Create character card',
  update_character_card: 'Update character card',
  delete_character_card: 'Delete character card',
}

interface FailedOperationsToastProps {
  /** Callback when user wants to retry an operation */
  onRetry?: (operationId: string, entityId: string, type: PendingOperation['type']) => void
}

/**
 * Component that shows toast notifications for failed operations.
 * Automatically displays when operations fail and provides dismiss/retry options.
 */
export function FailedOperationsToast({ onRetry }: FailedOperationsToastProps) {
  const { getFailedOperations, clearFailedOperation } = useOptimisticOperations()
  const { error: showError } = useToast()
  const shownOperationsRef = useRef<Set<string>>(new Set())

  const failedOperations = getFailedOperations()

  // Show toast for new failed operations
  useEffect(() => {
    for (const operation of failedOperations) {
      if (!shownOperationsRef.current.has(operation.id)) {
        shownOperationsRef.current.add(operation.id)
        const label = OPERATION_LABELS[operation.type] || operation.type
        showError(`${label} failed: ${operation.error || 'Unknown error'}. Changes have been reverted.`, 8000)
      }
    }

    // Clean up shown operations that are no longer in the failed list
    const currentIds = new Set(failedOperations.map(op => op.id))
    shownOperationsRef.current.forEach(id => {
      if (!currentIds.has(id)) {
        shownOperationsRef.current.delete(id)
      }
    })
  }, [failedOperations, showError])

  if (failedOperations.length === 0) {
    return null
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm"
      data-testid="failed-operations-toast-container"
    >
      {failedOperations.map(operation => (
        <div
          key={operation.id}
          className="bg-destructive/10 border border-destructive/30 rounded-lg p-3 shadow-lg backdrop-blur-sm"
          data-testid={`failed-operation-${operation.id}`}
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-destructive">
                {OPERATION_LABELS[operation.type] || operation.type} failed
              </p>
              <p className="text-xs text-muted-foreground mt-1 truncate">
                {operation.error || 'An error occurred'}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Changes have been reverted.
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {onRetry && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  onClick={() => onRetry(operation.id, operation.entityId, operation.type)}
                  title="Retry operation"
                  data-testid={`retry-operation-${operation.id}`}
                >
                  <RefreshCw className="w-4 h-4" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-foreground"
                onClick={() => clearFailedOperation(operation.id)}
                title="Dismiss"
                data-testid={`dismiss-operation-${operation.id}`}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

/**
 * Inline error indicator component for use on individual items.
 * Shows a warning icon when an entity has a failed operation.
 */
export function OperationErrorIndicator({
  entityId,
  className = '',
}: {
  entityId: string
  className?: string
}) {
  const { hasFailedOperation } = useOptimisticOperations()

  if (!hasFailedOperation(entityId)) {
    return null
  }

  return (
    <div
      className={`inline-flex items-center gap-1 text-destructive ${className}`}
      title="Operation failed - changes reverted"
      data-testid={`error-indicator-${entityId}`}
    >
      <AlertTriangle className="w-4 h-4" />
    </div>
  )
}

/**
 * Inline pending indicator component for use on individual items.
 * Shows a loading spinner when an entity has a pending operation.
 */
export function OperationPendingIndicator({
  entityId,
  className = '',
}: {
  entityId: string
  className?: string
}) {
  const { hasPendingOperation } = useOptimisticOperations()

  if (!hasPendingOperation(entityId)) {
    return null
  }

  return (
    <div
      className={`inline-flex items-center ${className}`}
      title="Saving..."
      data-testid={`pending-indicator-${entityId}`}
    >
      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )
}

/**
 * Combined indicator that shows pending or error state for an entity.
 */
export function OperationStatusIndicator({
  entityId,
  className = '',
}: {
  entityId: string
  className?: string
}) {
  const { hasPendingOperation, hasFailedOperation } = useOptimisticOperations()

  if (hasFailedOperation(entityId)) {
    return <OperationErrorIndicator entityId={entityId} className={className} />
  }

  if (hasPendingOperation(entityId)) {
    return <OperationPendingIndicator entityId={entityId} className={className} />
  }

  return null
}
