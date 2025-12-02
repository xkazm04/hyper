'use client'

/**
 * ScriptEditor Component
 *
 * A visual editor for creating and editing command scripts.
 * Provides a JSON editor with validation and preview.
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'
import { useScriptState } from '../../lib/scripting/ScriptStateContext'
import { parseCommandScript, serializeCommandScript } from '../../lib/scripting/parser'
import type { CommandScript, ExtendedCommandCategory, ScriptActionType } from '../../lib/scripting/types'
import { Button } from '@/components/ui/button'
import {
  X,
  Save,
  Play,
  Plus,
  Trash2,
  Upload,
  Download,
  AlertCircle,
  CheckCircle,
  Code,
  Eye,
  Wand2,
} from 'lucide-react'

const CATEGORIES: { value: ExtendedCommandCategory; label: string }[] = [
  { value: 'cards', label: 'Cards' },
  { value: 'characters', label: 'Characters' },
  { value: 'story', label: 'Story' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'view', label: 'View' },
  { value: 'export', label: 'Export' },
  { value: 'ai', label: 'AI' },
  { value: 'automation', label: 'Automation' },
  { value: 'custom', label: 'Custom' },
]

const ACTION_TYPES: { value: ScriptActionType; label: string; description: string }[] = [
  { value: 'ui.notify', label: 'Show Notification', description: 'Display a notification message' },
  { value: 'ui.confirm', label: 'Confirm Dialog', description: 'Show a confirmation dialog' },
  { value: 'ui.prompt', label: 'Input Prompt', description: 'Ask user for input' },
  { value: 'ai.complete', label: 'AI Completion', description: 'Get AI text completion' },
  { value: 'ai.generateImage', label: 'AI Image', description: 'Generate an image with AI' },
  { value: 'ai.generateChoices', label: 'AI Choices', description: 'Generate story choices with AI' },
  { value: 'ai.generateContent', label: 'AI Content', description: 'Generate story content with AI' },
  { value: 'card.create', label: 'Create Card', description: 'Create a new story card' },
  { value: 'card.update', label: 'Update Card', description: 'Update current card' },
  { value: 'card.delete', label: 'Delete Card', description: 'Delete a card' },
  { value: 'card.duplicate', label: 'Duplicate Card', description: 'Duplicate current card' },
  { value: 'card.select', label: 'Select Card', description: 'Select a specific card' },
  { value: 'character.create', label: 'Create Character', description: 'Create a new character' },
  { value: 'character.update', label: 'Update Character', description: 'Update a character' },
  { value: 'character.select', label: 'Select Character', description: 'Select a character' },
  { value: 'choice.create', label: 'Create Choice', description: 'Create a new choice' },
  { value: 'choice.delete', label: 'Delete Choice', description: 'Delete a choice' },
  { value: 'export.json', label: 'Export JSON', description: 'Export story as JSON' },
  { value: 'navigate', label: 'Navigate', description: 'Navigate to a path' },
  { value: 'view.toggle', label: 'Toggle View', description: 'Toggle a view mode' },
  { value: 'publish', label: 'Publish', description: 'Publish the story' },
  { value: 'unpublish', label: 'Unpublish', description: 'Unpublish the story' },
  { value: 'custom', label: 'Custom', description: 'Custom action (no-op)' },
]

const ICONS = [
  'wand', 'sparkles', 'bot', 'zap', 'play', 'file', 'users', 'eye',
  'layout', 'settings', 'refresh', 'plus', 'trash', 'copy', 'message',
  'image', 'send', 'upload', 'download',
]

export default function ScriptEditor() {
  const {
    isScriptEditorOpen,
    closeScriptEditor,
    editingScript,
    setEditingScript,
    addScript,
    removeScript,
    scripts,
    createNewScript,
    importScripts,
    exportScripts,
  } = useScriptState()

  const [mode, setMode] = useState<'visual' | 'code'>('visual')
  const [jsonCode, setJsonCode] = useState('')
  const [errors, setErrors] = useState<string[]>([])
  const [showScriptList, setShowScriptList] = useState(!editingScript)

  const fileInputRef = useRef<HTMLInputElement>(null)

  // Sync JSON code with editing script
  useEffect(() => {
    if (editingScript) {
      setJsonCode(serializeCommandScript(editingScript))
      setShowScriptList(false)
    } else {
      setShowScriptList(true)
    }
  }, [editingScript])

  // Validate JSON code on change
  useEffect(() => {
    if (mode === 'code' && jsonCode) {
      const result = parseCommandScript(jsonCode)
      if (!result.success && result.errors) {
        setErrors(result.errors.map((e) => e.message))
      } else {
        setErrors([])
      }
    }
  }, [jsonCode, mode])

  const handleSave = useCallback(() => {
    if (!editingScript) return

    let scriptToSave = editingScript

    if (mode === 'code') {
      const result = parseCommandScript(jsonCode)
      if (!result.success || !result.script) {
        setErrors(result.errors?.map((e) => e.message) || ['Invalid script'])
        return
      }
      scriptToSave = result.script
    }

    // Update metadata
    scriptToSave = {
      ...scriptToSave,
      metadata: {
        ...scriptToSave.metadata,
        updatedAt: new Date().toISOString(),
      },
    }

    addScript(scriptToSave)
    setEditingScript(null)
    setShowScriptList(true)
  }, [editingScript, mode, jsonCode, addScript, setEditingScript])

  const handleTest = useCallback(async () => {
    if (!editingScript) return

    // Save first
    handleSave()
  }, [editingScript, handleSave])

  const handleDelete = useCallback(() => {
    if (!editingScript) return

    if (window.confirm(`Delete "${editingScript.label}"?`)) {
      removeScript(editingScript.id)
      setEditingScript(null)
      setShowScriptList(true)
    }
  }, [editingScript, removeScript, setEditingScript])

  const handleImport = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        const result = importScripts(content)
        if (result.success) {
          alert(`Imported ${result.count} scripts`)
        } else {
          alert(`Import failed: ${result.errors?.join(', ')}`)
        }
      }
      reader.readAsText(file)

      // Reset input
      e.target.value = ''
    },
    [importScripts]
  )

  const handleExport = useCallback(() => {
    const json = exportScripts('My Command Library', 'Custom commands for HyperCard Renaissance')
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'command-library.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [exportScripts])

  const updateScriptField = useCallback(
    (field: keyof CommandScript, value: unknown) => {
      if (!editingScript) return
      setEditingScript({ ...editingScript, [field]: value })
    },
    [editingScript, setEditingScript]
  )

  const addAction = useCallback(() => {
    if (!editingScript) return
    setEditingScript({
      ...editingScript,
      actions: [
        ...editingScript.actions,
        { type: 'ui.notify', params: { message: 'Hello', type: 'info' } },
      ],
    })
  }, [editingScript, setEditingScript])

  const removeAction = useCallback(
    (index: number) => {
      if (!editingScript) return
      setEditingScript({
        ...editingScript,
        actions: editingScript.actions.filter((_, i) => i !== index),
      })
    },
    [editingScript, setEditingScript]
  )

  const updateAction = useCallback(
    (index: number, field: string, value: unknown) => {
      if (!editingScript) return
      const actions = [...editingScript.actions]
      actions[index] = { ...actions[index], [field]: value }
      setEditingScript({ ...editingScript, actions })
    },
    [editingScript, setEditingScript]
  )

  if (!isScriptEditorOpen) return null

  return (
    <div
      className={cn(
        'fixed inset-0 z-50 flex items-center justify-center',
        'bg-background/80 backdrop-blur-sm',
        'animate-in fade-in-0 duration-150'
      )}
      onClick={(e) => e.target === e.currentTarget && closeScriptEditor()}
      data-testid="script-editor-overlay"
    >
      <div
        className={cn(
          'w-full max-w-4xl max-h-[90vh] mx-4',
          'bg-card border-4 border-border',
          'shadow-[8px_8px_0px_0px_hsl(var(--border))]',
          'flex flex-col overflow-hidden',
          'animate-in slide-in-from-top-4 fade-in-0 duration-200'
        )}
        data-testid="script-editor-dialog"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b-2 border-border">
          <div className="flex items-center gap-3">
            <Wand2 className="w-5 h-5" />
            <h2 className="font-bold text-lg">Command Script Editor</h2>
          </div>
          <div className="flex items-center gap-2">
            {editingScript && (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setMode(mode === 'visual' ? 'code' : 'visual')}
                  className="gap-1"
                  data-testid="script-editor-toggle-mode-btn"
                >
                  {mode === 'visual' ? <Code className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {mode === 'visual' ? 'Code' : 'Visual'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingScript(null)
                    setShowScriptList(true)
                  }}
                  data-testid="script-editor-back-btn"
                >
                  Back to List
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={closeScriptEditor}
              data-testid="script-editor-close-btn"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showScriptList ? (
            <ScriptList
              scripts={scripts}
              onSelect={(script) => {
                setEditingScript(script)
                setShowScriptList(false)
              }}
              onNew={createNewScript}
              onImport={handleImport}
              onExport={handleExport}
              onDelete={removeScript}
            />
          ) : mode === 'visual' ? (
            <VisualEditor
              script={editingScript!}
              updateField={updateScriptField}
              addAction={addAction}
              removeAction={removeAction}
              updateAction={updateAction}
            />
          ) : (
            <CodeEditor
              code={jsonCode}
              onChange={setJsonCode}
              errors={errors}
            />
          )}
        </div>

        {/* Footer */}
        {editingScript && !showScriptList && (
          <div className="flex items-center justify-between px-4 py-3 border-t-2 border-border bg-muted/50">
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="gap-1"
                data-testid="script-editor-delete-btn"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
            </div>
            <div className="flex items-center gap-2">
              {errors.length > 0 && (
                <span className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.length} error(s)
                </span>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                className="gap-1"
                disabled={errors.length > 0}
                data-testid="script-editor-test-btn"
              >
                <Play className="w-4 h-4" />
                Test
              </Button>
              <Button
                size="sm"
                onClick={handleSave}
                className="gap-1"
                disabled={errors.length > 0}
                data-testid="script-editor-save-btn"
              >
                <Save className="w-4 h-4" />
                Save
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
        data-testid="script-editor-import-input"
      />
    </div>
  )
}

// Script List Component
interface ScriptListProps {
  scripts: CommandScript[]
  onSelect: (script: CommandScript) => void
  onNew: () => void
  onImport: () => void
  onExport: () => void
  onDelete: (id: string) => void
}

function ScriptList({ scripts, onSelect, onNew, onImport, onExport, onDelete }: ScriptListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Your Command Scripts</h3>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onImport}
            className="gap-1"
            data-testid="script-list-import-btn"
          >
            <Upload className="w-4 h-4" />
            Import
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onExport}
            className="gap-1"
            disabled={scripts.length === 0}
            data-testid="script-list-export-btn"
          >
            <Download className="w-4 h-4" />
            Export
          </Button>
          <Button
            size="sm"
            onClick={onNew}
            className="gap-1"
            data-testid="script-list-new-btn"
          >
            <Plus className="w-4 h-4" />
            New Script
          </Button>
        </div>
      </div>

      {scripts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Wand2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No custom scripts yet.</p>
          <p className="text-sm">Create your first command script to extend the editor!</p>
        </div>
      ) : (
        <div className="grid gap-2" data-testid="script-list">
          {scripts.map((script) => (
            <div
              key={script.id}
              className={cn(
                'flex items-center justify-between p-3 rounded-lg',
                'bg-muted/50 hover:bg-muted',
                'border border-border',
                'cursor-pointer transition-colors'
              )}
              onClick={() => onSelect(script)}
              data-testid={`script-item-${script.id}`}
            >
              <div className="flex items-center gap-3">
                <div className="text-muted-foreground">
                  <Wand2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-medium">{script.label}</div>
                  <div className="text-sm text-muted-foreground">
                    {script.description || `${script.actions.length} action(s)`}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-1 bg-background rounded border">
                  {script.category}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`Delete "${script.label}"?`)) {
                      onDelete(script.id)
                    }
                  }}
                  data-testid={`script-delete-${script.id}-btn`}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Visual Editor Component
interface VisualEditorProps {
  script: CommandScript
  updateField: (field: keyof CommandScript, value: unknown) => void
  addAction: () => void
  removeAction: (index: number) => void
  updateAction: (index: number, field: string, value: unknown) => void
}

function VisualEditor({
  script,
  updateField,
  addAction,
  removeAction,
  updateAction,
}: VisualEditorProps) {
  return (
    <div className="space-y-6" data-testid="script-visual-editor">
      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Label</label>
          <input
            type="text"
            value={script.label}
            onChange={(e) => updateField('label', e.target.value)}
            className="w-full px-3 py-2 bg-background border-2 border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Command label"
            data-testid="script-label-input"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">ID</label>
          <input
            type="text"
            value={script.id}
            onChange={(e) => updateField('id', e.target.value.toLowerCase().replace(/\s+/g, '-'))}
            className="w-full px-3 py-2 bg-background border-2 border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="unique-id"
            data-testid="script-id-input"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <input
          type="text"
          value={script.description || ''}
          onChange={(e) => updateField('description', e.target.value)}
          className="w-full px-3 py-2 bg-background border-2 border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="What does this command do?"
          data-testid="script-description-input"
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Category</label>
          <select
            value={script.category}
            onChange={(e) => updateField('category', e.target.value)}
            className="w-full px-3 py-2 bg-background border-2 border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="script-category-select"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat.value} value={cat.value}>
                {cat.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Icon</label>
          <select
            value={script.icon || 'wand'}
            onChange={(e) => updateField('icon', e.target.value)}
            className="w-full px-3 py-2 bg-background border-2 border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            data-testid="script-icon-select"
          >
            {ICONS.map((icon) => (
              <option key={icon} value={icon}>
                {icon}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Shortcut</label>
          <input
            type="text"
            value={script.shortcut || ''}
            onChange={(e) => updateField('shortcut', e.target.value)}
            className="w-full px-3 py-2 bg-background border-2 border-border rounded focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Ctrl+Shift+X"
            data-testid="script-shortcut-input"
          />
        </div>
      </div>

      {/* Actions */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium">Actions</label>
          <Button
            variant="outline"
            size="sm"
            onClick={addAction}
            className="gap-1"
            data-testid="script-add-action-btn"
          >
            <Plus className="w-4 h-4" />
            Add Action
          </Button>
        </div>

        <div className="space-y-2" data-testid="script-actions-list">
          {script.actions.map((action, index) => (
            <div
              key={index}
              className="p-3 bg-muted/50 rounded-lg border border-border"
              data-testid={`script-action-${index}`}
            >
              <div className="flex items-center justify-between mb-2">
                <select
                  value={action.type}
                  onChange={(e) => updateAction(index, 'type', e.target.value)}
                  className="px-2 py-1 bg-background border border-border rounded text-sm"
                  data-testid={`script-action-type-${index}-select`}
                >
                  {ACTION_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeAction(index)}
                  className="h-6 w-6"
                  data-testid={`script-remove-action-${index}-btn`}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="text-xs text-muted-foreground">
                {ACTION_TYPES.find((t) => t.value === action.type)?.description}
              </div>
              {action.params && (
                <div className="mt-2 text-xs font-mono bg-background p-2 rounded overflow-x-auto">
                  {JSON.stringify(action.params, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Code Editor Component
interface CodeEditorProps {
  code: string
  onChange: (code: string) => void
  errors: string[]
}

function CodeEditor({ code, onChange, errors }: CodeEditorProps) {
  return (
    <div className="space-y-4" data-testid="script-code-editor">
      <div className="relative">
        <textarea
          value={code}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            'w-full h-[400px] px-4 py-3 font-mono text-sm',
            'bg-background border-2 rounded',
            'focus:outline-none focus:ring-2 focus:ring-primary',
            errors.length > 0 ? 'border-destructive' : 'border-border'
          )}
          spellCheck={false}
          data-testid="script-code-textarea"
        />
      </div>

      {errors.length > 0 && (
        <div className="p-3 bg-destructive/10 border border-destructive rounded-lg" data-testid="script-code-errors">
          <div className="flex items-center gap-2 mb-2 text-destructive">
            <AlertCircle className="w-4 h-4" />
            <span className="font-medium">Validation Errors</span>
          </div>
          <ul className="text-sm space-y-1">
            {errors.map((error, i) => (
              <li key={i} className="text-muted-foreground">
                • {error}
              </li>
            ))}
          </ul>
        </div>
      )}

      {errors.length === 0 && code && (
        <div className="flex items-center gap-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Script is valid</span>
        </div>
      )}
    </div>
  )
}
