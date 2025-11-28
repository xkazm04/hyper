'use client'

import { useState, useCallback } from 'react'
import { Download, Package, FileCode, Globe, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { StoryStack, StoryCard, Choice, Character } from '@/lib/types'
import type { CompileResult, ExportFormat, CompileStats } from '../lib/types'
import { compileStory, exportBundle, downloadFile } from '../lib/compiler'
import { formatBytes, formatDuration } from '../lib/utils'
import { ExportFormatSelector } from './ExportFormatSelector'
import { CompilationProgress } from './CompilationProgress'
import { CompilationStats } from './CompilationStats'

interface WasmExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  stack: StoryStack
  cards: StoryCard[]
  choices: Choice[]
  characters: Character[]
}

type ExportStatus = 'idle' | 'compiling' | 'success' | 'error'

export function WasmExportDialog({
  open,
  onOpenChange,
  stack,
  cards,
  choices,
  characters,
}: WasmExportDialogProps) {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [exportFormat, setExportFormat] = useState<ExportFormat>('html-bundle')
  const [compileResult, setCompileResult] = useState<CompileResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCompile = useCallback(async () => {
    setStatus('compiling')
    setError(null)
    setCompileResult(null)

    try {
      const result = await compileStory(stack, cards, choices, characters, {
        embedAssets: exportFormat !== 'json-bundle',
        compressAssets: true,
        optimizeForSize: true,
        targetFormat: exportFormat.includes('wasm') ? 'wasm' : 'json',
      })

      setCompileResult(result)

      if (result.success) {
        setStatus('success')
      } else {
        setStatus('error')
        setError(result.errors.map((e) => e.message).join('; '))
      }
    } catch (err) {
      setStatus('error')
      setError(err instanceof Error ? err.message : 'Compilation failed')
    }
  }, [stack, cards, choices, characters, exportFormat])

  const handleDownload = useCallback(async () => {
    if (!compileResult?.success) return

    try {
      const blob = await exportBundle(compileResult, {
        format: exportFormat,
        filename: stack.slug || stack.name.toLowerCase().replace(/\s+/g, '-'),
        includePlayer: true,
        minifyOutput: true,
        embedStyles: true,
      })

      if (blob) {
        const ext = getFileExtension(exportFormat)
        const filename = `${stack.slug || stack.name.toLowerCase().replace(/\s+/g, '-')}.${ext}`
        downloadFile(blob, filename)
      }
    } catch (err) {
      console.error('Download failed:', err)
      setError(err instanceof Error ? err.message : 'Download failed')
    }
  }, [compileResult, exportFormat, stack])

  const handleClose = () => {
    setStatus('idle')
    setCompileResult(null)
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-lg border-4 border-border bg-card
                   shadow-[6px_6px_0px_0px_hsl(var(--border))]"
        data-testid="wasm-export-dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" />
            Export Offline Bundle
          </DialogTitle>
          <DialogDescription className="text-sm">
            Compile your story into a standalone file that runs entirely offline, without any server
            connection.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Story info */}
          <div
            className="p-3 bg-muted/50 rounded-lg border-2 border-border"
            data-testid="wasm-export-story-info"
          >
            <h4 className="font-medium text-foreground">{stack.name}</h4>
            <div className="text-sm text-muted-foreground mt-1 flex items-center gap-4">
              <span>{cards.length} cards</span>
              <span>{choices.length} choices</span>
              <span>{characters.length} characters</span>
            </div>
          </div>

          {/* Format selector */}
          {status === 'idle' && (
            <ExportFormatSelector
              selectedFormat={exportFormat}
              onFormatChange={setExportFormat}
            />
          )}

          {/* Compilation progress */}
          {status === 'compiling' && <CompilationProgress />}

          {/* Success state */}
          {status === 'success' && compileResult && (
            <div className="space-y-4" data-testid="wasm-export-success">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Compilation successful!</span>
              </div>
              <CompilationStats stats={compileResult.stats} />
              {compileResult.warnings.length > 0 && (
                <div
                  className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-2 border-yellow-200 dark:border-yellow-800"
                  data-testid="wasm-export-warnings"
                >
                  <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-2">
                    Warnings ({compileResult.warnings.length})
                  </h5>
                  <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1">
                    {compileResult.warnings.slice(0, 3).map((w, i) => (
                      <li key={i}>• {w.message}</li>
                    ))}
                    {compileResult.warnings.length > 3 && (
                      <li>...and {compileResult.warnings.length - 3} more</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Error state */}
          {status === 'error' && (
            <div
              className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border-2 border-red-200 dark:border-red-800"
              data-testid="wasm-export-error"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800 dark:text-red-200">Compilation failed</p>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">{error}</p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row justify-end gap-2">
          {status === 'idle' && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
                data-testid="wasm-export-cancel-btn"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCompile}
                disabled={cards.length === 0}
                className="border-2 border-border bg-primary text-primary-foreground
                           shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all
                           disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="wasm-export-compile-btn"
              >
                <FileCode className="w-4 h-4 mr-2" />
                Compile Bundle
              </Button>
            </>
          )}

          {status === 'compiling' && (
            <Button
              disabled
              className="border-2 border-border bg-muted text-muted-foreground"
              data-testid="wasm-export-compiling-btn"
            >
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Compiling...
            </Button>
          )}

          {status === 'success' && (
            <>
              <Button
                variant="outline"
                onClick={() => setStatus('idle')}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
                data-testid="wasm-export-recompile-btn"
              >
                Recompile
              </Button>
              <Button
                onClick={handleDownload}
                className="border-2 border-border bg-green-600 text-white
                           shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
                data-testid="wasm-export-download-btn"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Bundle
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <Button
                variant="outline"
                onClick={handleClose}
                className="border-2 border-border shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
                data-testid="wasm-export-close-btn"
              >
                Close
              </Button>
              <Button
                onClick={handleCompile}
                className="border-2 border-border bg-primary text-primary-foreground
                           shadow-[2px_2px_0px_0px_hsl(var(--border))]
                           hover:shadow-[3px_3px_0px_0px_hsl(var(--border))]
                           hover:-translate-x-px hover:-translate-y-px transition-all"
                data-testid="wasm-export-retry-btn"
              >
                Retry
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function getFileExtension(format: ExportFormat): string {
  switch (format) {
    case 'html-bundle':
      return 'html'
    case 'json-bundle':
      return 'json'
    case 'wasm-standalone':
    case 'wasm-embed':
      return 'wasm'
    default:
      return 'bin'
  }
}
