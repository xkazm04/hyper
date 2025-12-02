'use client'

import { useRef, useState } from 'react'
import { Download, Upload, FileJson, Check, AlertTriangle, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody, ModalFooter } from '@/components/ui/modal'
import { useStoryGraphExport } from '../hooks/useStoryGraphExport'

interface ExportImportPanelProps {
  className?: string
}

/**
 * ExportImportPanel - Panel for exporting and importing story graphs
 *
 * Features:
 * - Export current graph to JSON file
 * - Import from JSON file with validation
 * - Confirmation dialog before replacing current graph
 */
export function ExportImportPanel({ className }: ExportImportPanelProps) {
  const {
    handleExport,
    isExporting,
    handleImportFile,
    handleImportToCurrentStack,
    isImporting,
    importData,
    validationResult,
    clearImportData,
    error,
    clearError,
  } = useStoryGraphExport()

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      await handleImportFile(file)
      setShowConfirmDialog(true)
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleImportClick = () => {
    fileInputRef.current?.click()
  }

  const handleConfirmImport = async () => {
    await handleImportToCurrentStack()
    setShowConfirmDialog(false)
  }

  const handleCancelImport = () => {
    clearImportData()
    setShowConfirmDialog(false)
  }

  return (
    <>
      <div
        className={`bg-card/95 border-2 border-border rounded-lg p-3 shadow-lg backdrop-blur-sm ${className || ''}`}
        data-testid="export-import-panel"
      >
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border">
          <FileJson className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-bold text-foreground">Export / Import</h3>
        </div>

        <div className="flex flex-col gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting}
            className="w-full justify-start"
            data-testid="export-graph-btn"
          >
            {isExporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Export to JSON
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full justify-start"
            data-testid="import-graph-btn"
          >
            {isImporting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            Import from JSON
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="import-file-input"
          />
        </div>

        {error && (
          <div className="mt-3 p-2 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium">Error</p>
                <p className="whitespace-pre-wrap">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="flex-shrink-0 hover:opacity-70"
                data-testid="clear-error-btn"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Confirmation Dialog */}
      <Modal open={showConfirmDialog} onOpenChange={setShowConfirmDialog} size="md">
        <ModalHeader>
          <ModalTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Import Story Graph
          </ModalTitle>
          <ModalDescription>
            This will replace all cards, choices, and characters in your current story.
          </ModalDescription>
        </ModalHeader>

        <ModalBody>
          {importData && validationResult && (
            <div className="space-y-4">
              {/* Import Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-sm">Import Summary</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Story:</span>
                    <span className="font-medium">{importData.storyStack.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cards:</span>
                    <span className="font-medium">{importData.metadata.totalCards}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Choices:</span>
                    <span className="font-medium">{importData.metadata.totalChoices}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Characters:</span>
                    <span className="font-medium">{importData.metadata.totalCharacters}</span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Exported: {new Date(importData.exportedAt).toLocaleString()}
                </div>
              </div>

              {/* Validation Status */}
              <div className="flex items-center gap-2">
                {validationResult.isValid ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-500" />
                    <span className="text-sm text-emerald-500 font-medium">
                      Validation passed
                    </span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-destructive" />
                    <span className="text-sm text-destructive font-medium">
                      Validation failed
                    </span>
                  </>
                )}
              </div>

              {/* Warnings */}
              {validationResult.warnings.length > 0 && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-3">
                  <h5 className="text-xs font-medium text-amber-600 mb-1">Warnings:</h5>
                  <ul className="text-xs text-amber-600 list-disc list-inside space-y-1">
                    {validationResult.warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Errors */}
              {validationResult.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/30 rounded-md p-3">
                  <h5 className="text-xs font-medium text-destructive mb-1">Errors:</h5>
                  <ul className="text-xs text-destructive list-disc list-inside space-y-1">
                    {validationResult.errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </ModalBody>

        <ModalFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancelImport}
            disabled={isImporting}
            data-testid="cancel-import-btn"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            disabled={isImporting || !validationResult?.isValid}
            data-testid="confirm-import-btn"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import
              </>
            )}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}
