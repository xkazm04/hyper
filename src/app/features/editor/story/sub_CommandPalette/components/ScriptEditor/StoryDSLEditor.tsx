'use client'

/**
 * StoryDSLEditor Component
 *
 * A text editor for editing the story graph using the DSL format.
 * Provides real-time sync with the visual canvas, syntax highlighting,
 * and validation feedback.
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import {
  parseStoryDsl,
  serializeStoryToDsl,
  createSyncState,
  updateSyncStateFromDsl,
  updateSyncStateFromGraph,
  applyDslToGraph,
  type DslSyncState,
} from '../../lib/scripting/storyDsl'
import { Button } from '@/components/ui/button'
import {
  X,
  Save,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Code,
  FileText,
  Copy,
  Download,
  Upload,
  Undo2,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2,
} from 'lucide-react'

interface StoryDSLEditorProps {
  isOpen: boolean
  onClose: () => void
}

export default function StoryDSLEditor({ isOpen, onClose }: StoryDSLEditorProps) {
  const {
    storyStack,
    storyCards,
    choices,
    setStoryCards,
    setChoices,
    setCurrentCardId,
  } = useEditor()

  // Sync state
  const [syncState, setSyncState] = useState<DslSyncState | null>(null)
  const [localText, setLocalText] = useState('')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showPreview, setShowPreview] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Initialize sync state when opening
  useEffect(() => {
    if (isOpen && storyStack && !syncState) {
      const initialState = createSyncState(storyStack, storyCards, choices)
      setSyncState(initialState)
      setLocalText(initialState.dslText)
    }
  }, [isOpen, storyStack, storyCards, choices, syncState])

  // Update sync state when DSL text changes
  const handleTextChange = useCallback((newText: string) => {
    setLocalText(newText)
    if (syncState) {
      const newState = updateSyncStateFromDsl(syncState, newText)
      setSyncState(newState)
    }
  }, [syncState])

  // Sync from graph when graph changes externally
  const handleSyncFromGraph = useCallback(() => {
    if (!storyStack) return
    const newState = createSyncState(storyStack, storyCards, choices)
    setSyncState(newState)
    setLocalText(newState.dslText)
  }, [storyStack, storyCards, choices])

  // Apply DSL changes to graph
  const handleApplyToGraph = useCallback(async () => {
    if (!syncState?.document || !storyStack) return

    setIsSyncing(true)
    try {
      const result = applyDslToGraph(
        syncState.document,
        storyStack,
        storyCards,
        choices,
        syncState.idMapping
      )

      if (!result.success) {
        console.error('Failed to apply DSL:', result.errors)
        return
      }

      // For now, we'll just log what would change
      // In a full implementation, this would call the appropriate services
      console.log('DSL Apply Result:', {
        created: result.created,
        updated: result.updated,
        deleted: result.deleted,
        choicesCreated: result.choicesCreated,
        choicesUpdated: result.choicesUpdated,
        choicesDeleted: result.choicesDeleted,
      })

      // Update sync state to reflect applied changes
      const newState = updateSyncStateFromGraph(syncState, storyStack, storyCards, choices)
      setSyncState(newState)
    } finally {
      setIsSyncing(false)
    }
  }, [syncState, storyStack, storyCards, choices])

  // Copy DSL to clipboard
  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(localText)
  }, [localText])

  // Download DSL as file
  const handleDownload = useCallback(() => {
    const blob = new Blob([localText], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${storyStack?.name || 'story'}.story.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [localText, storyStack?.name])

  // Import DSL from file
  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      handleTextChange(content)
    }
    reader.readAsText(file)
    e.target.value = ''
  }, [handleTextChange])

  // Reset to saved state
  const handleReset = useCallback(() => {
    if (!storyStack) return
    if (!window.confirm('Discard all unsaved changes?')) return
    handleSyncFromGraph()
  }, [storyStack, handleSyncFromGraph])

  // Parse results for display
  const parseResult = useMemo(() => {
    if (!localText) return null
    return parseStoryDsl(localText)
  }, [localText])

  // Status indicators
  const hasErrors = (parseResult?.errors.length ?? 0) > 0
  const hasWarnings = (parseResult?.warnings.length ?? 0) > 0
  const isValid = parseResult?.success ?? false
  const isDirty = syncState?.isDirty ?? false

  if (!isOpen) return null

  return (
    <div
      className={cn(
        'fixed z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        'animate-in fade-in-0 duration-150',
        isFullscreen ? 'inset-0' : 'inset-4'
      )}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      data-testid="story-dsl-editor-overlay"
    >
      <div
        className={cn(
          'bg-card border-4 border-border',
          'shadow-[8px_8px_0px_0px_hsl(var(--border))]',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-top-4 fade-in-0 duration-200',
          isFullscreen ? 'w-full h-full' : 'w-full max-w-6xl max-h-[90vh] mx-4'
        )}
        data-testid="story-dsl-editor-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5" />
            <h2 className="font-bold text-lg">Story DSL Editor</h2>
            {isDirty && (
              <span className="text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-600 rounded-full">
                Unsaved
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowPreview(!showPreview)}
              className="gap-1"
              data-testid="dsl-toggle-preview-btn"
            >
              {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="gap-1"
              data-testid="dsl-toggle-fullscreen-btn"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              data-testid="dsl-editor-close-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-muted/30">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSyncFromGraph}
            className="gap-1"
            data-testid="dsl-sync-from-graph-btn"
          >
            <RefreshCw className="w-4 h-4" />
            Sync from Graph
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            className="gap-1"
            data-testid="dsl-copy-btn"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-1"
            data-testid="dsl-download-btn"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleImport}
            className="gap-1"
            data-testid="dsl-import-btn"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          {isDirty && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="gap-1 text-muted-foreground"
              data-testid="dsl-reset-btn"
            >
              <Undo2 className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>

        {/* Main Content */}
        <div className={cn(
          'flex-1 overflow-hidden flex',
          showPreview ? 'gap-4' : ''
        )}>
          {/* Editor Panel */}
          <div className={cn(
            'flex flex-col overflow-hidden',
            showPreview ? 'w-1/2' : 'w-full'
          )}>
            {/* DSL Reference */}
            <div className="px-4 py-2 bg-muted/20 text-xs text-muted-foreground border-b border-border">
              <span className="font-medium">DSL Format:</span>{' '}
              <code className="bg-muted px-1 rounded">## id: Title</code> for cards,{' '}
              <code className="bg-muted px-1 rounded">{`-> Label -> target`}</code> for choices,{' '}
              <code className="bg-muted px-1 rounded">@start</code> marks entry point
            </div>

            {/* Text Editor */}
            <div className="flex-1 relative overflow-hidden">
              <textarea
                ref={textareaRef}
                value={localText}
                onChange={(e) => handleTextChange(e.target.value)}
                className={cn(
                  'w-full h-full px-4 py-3 font-mono text-sm',
                  'bg-background resize-none',
                  'focus:outline-none',
                  'leading-relaxed',
                  hasErrors ? 'border-l-4 border-destructive' : '',
                  hasWarnings && !hasErrors ? 'border-l-4 border-yellow-500' : ''
                )}
                spellCheck={false}
                placeholder={`# Story: My Adventure
# Description: An epic tale

@start
## beginning: The Beginning
You stand at the crossroads...

-> Go left -> left_path
-> Go right -> right_path

---

## left_path: The Left Path
The path winds through the forest...

-> Continue -> END`}
                data-testid="dsl-editor-textarea"
              />
            </div>
          </div>

          {/* Preview Panel */}
          {showPreview && (
            <div className="w-1/2 flex flex-col overflow-hidden border-l border-border">
              <div className="px-4 py-2 bg-muted/30 text-sm font-medium border-b border-border">
                Preview ({parseResult?.document?.cards.length ?? 0} cards)
              </div>
              <div className="flex-1 overflow-y-auto p-4 bg-muted/10">
                {parseResult?.document?.cards.map((card, index) => (
                  <div
                    key={card.id}
                    className="mb-4 p-3 bg-card border-2 border-border rounded-lg"
                    data-testid={`dsl-preview-card-${index}`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      {card.isStart && (
                        <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                          START
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground font-mono">
                        {card.id}
                      </span>
                    </div>
                    <h3 className="font-bold mb-1">{card.title}</h3>
                    {card.content && (
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {card.content}
                      </p>
                    )}
                    {card.choices.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {card.choices.map((choice, ci) => (
                          <span
                            key={ci}
                            className={cn(
                              'text-xs px-2 py-0.5 rounded',
                              choice.isTerminal
                                ? 'bg-green-500/20 text-green-600'
                                : 'bg-muted text-muted-foreground'
                            )}
                          >
                            {choice.label} → {choice.targetId}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between px-4 py-2 border-t-2 border-border bg-muted/50">
          <div className="flex items-center gap-4">
            {/* Status indicator */}
            {hasErrors ? (
              <div className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <span className="text-sm">{parseResult?.errors.length} error(s)</span>
              </div>
            ) : hasWarnings ? (
              <div className="flex items-center gap-1.5 text-yellow-600">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{parseResult?.warnings.length} warning(s)</span>
              </div>
            ) : isValid ? (
              <div className="flex items-center gap-1.5 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm">Valid DSL</span>
              </div>
            ) : null}

            {/* Stats */}
            <span className="text-xs text-muted-foreground">
              {parseResult?.document?.cards.length ?? 0} cards •{' '}
              {parseResult?.document?.cards.reduce((sum, c) => sum + c.choices.length, 0) ?? 0} choices
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Error list */}
            {hasErrors && (
              <div className="text-xs text-destructive max-w-md truncate">
                {parseResult?.errors[0]?.message}
              </div>
            )}

            {/* Apply button */}
            <Button
              size="sm"
              onClick={handleApplyToGraph}
              disabled={hasErrors || isSyncing || !isDirty}
              className="gap-1"
              data-testid="dsl-apply-btn"
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Apply Changes
            </Button>
          </div>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.story,.dsl"
        className="hidden"
        onChange={handleFileChange}
        data-testid="dsl-import-input"
      />
    </div>
  )
}
