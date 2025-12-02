'use client'

import { useMemo } from 'react'
import { useEditor } from '@/contexts/EditorContext'
import { useRouter } from 'next/navigation'
import { Command, CommandCategory } from './types'
import {
  Plus,
  FileText,
  Users,
  Eye,
  Upload,
  Download,
  Copy,
  Trash2,
  ArrowLeft,
  Layout,
  Settings,
  RefreshCw,
  Wand2,
  Code,
} from 'lucide-react'

interface UseCommandsProps {
  onAddCard: () => void
  onAddCharacter: () => void
  onPreview: () => void
  onPublish: () => void
  onTogglePreview?: () => void
  onExportStory?: () => void
  onDuplicateCard?: () => void
  onOpenScriptEditor?: () => void
  onOpenDSLEditor?: () => void
  scriptedCommands?: Command[]
}

export function useCommands({
  onAddCard,
  onAddCharacter,
  onPreview,
  onPublish,
  onTogglePreview,
  onExportStory,
  onDuplicateCard,
  onOpenScriptEditor,
  onOpenDSLEditor,
  scriptedCommands = [],
}: UseCommandsProps): Command[] {
  const router = useRouter()
  const { storyStack, currentCard, storyCards, deleteCard } = useEditor()

  const commands = useMemo<Command[]>(() => {
    const commandList: Command[] = [
      // Navigation commands
      {
        id: 'go-dashboard',
        label: 'Go to Dashboard',
        description: 'Navigate back to the dashboard',
        icon: ArrowLeft,
        shortcut: 'Alt+D',
        category: 'navigation',
        action: () => router.push('/dashboard'),
      },

      // Card commands
      {
        id: 'add-card',
        label: 'Add New Card',
        description: 'Create a new story card',
        icon: Plus,
        shortcut: 'Ctrl+N',
        category: 'cards',
        action: onAddCard,
      },
      {
        id: 'duplicate-card',
        label: 'Duplicate Current Card',
        description: 'Create a copy of the current card',
        icon: Copy,
        category: 'cards',
        action: onDuplicateCard || (() => {}),
        disabled: !currentCard || !onDuplicateCard,
      },
      {
        id: 'delete-card',
        label: 'Delete Current Card',
        description: 'Remove the current card from the story',
        icon: Trash2,
        category: 'cards',
        action: () => {
          if (currentCard && storyCards.length > 1) {
            deleteCard(currentCard.id)
          }
        },
        disabled: !currentCard || storyCards.length <= 1,
      },

      // Character commands
      {
        id: 'add-character',
        label: 'Add New Character',
        description: 'Create a new character',
        icon: Users,
        shortcut: 'Ctrl+Shift+C',
        category: 'characters',
        action: onAddCharacter,
      },

      // Story commands
      {
        id: 'publish',
        label: storyStack?.isPublished ? 'Manage Publication' : 'Publish Story',
        description: storyStack?.isPublished
          ? 'View or update publication settings'
          : 'Make your story available to readers',
        icon: Upload,
        shortcut: 'Ctrl+Shift+P',
        category: 'story',
        action: onPublish,
      },
      {
        id: 'preview',
        label: 'Preview Story',
        description: 'Open the story player in a new tab',
        icon: Eye,
        category: 'story',
        action: onPreview,
        disabled: !storyStack?.isPublished,
      },

      // View commands
      {
        id: 'toggle-split-view',
        label: 'Toggle Split View',
        description: 'Switch between default and split view modes',
        icon: Layout,
        shortcut: 'Ctrl+\\',
        category: 'view',
        action: onTogglePreview || (() => {}),
        disabled: !onTogglePreview,
      },

      // Export commands
      {
        id: 'export-story',
        label: 'Export Story',
        description: 'Download story as JSON',
        icon: Download,
        category: 'export',
        action: onExportStory || (() => {
          // Default export implementation
          if (storyStack && storyCards) {
            const exportData = {
              story: storyStack,
              cards: storyCards,
              exportedAt: new Date().toISOString(),
            }
            const blob = new Blob([JSON.stringify(exportData, null, 2)], {
              type: 'application/json',
            })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${storyStack.name.replace(/[^a-z0-9]/gi, '_')}_export.json`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)
          }
        }),
      },

      // Script Editor command
      ...(onOpenScriptEditor ? [{
        id: 'open-script-editor',
        label: 'Command Script Editor',
        description: 'Create and manage custom commands',
        icon: Wand2,
        shortcut: 'Ctrl+Shift+S',
        category: 'view' as CommandCategory,
        action: onOpenScriptEditor,
      }] : []),

      // Story DSL Editor command
      ...(onOpenDSLEditor ? [{
        id: 'open-dsl-editor',
        label: 'Story DSL Editor',
        description: 'Edit story graph as text (version control friendly)',
        icon: Code,
        shortcut: 'Ctrl+Shift+D',
        category: 'view' as CommandCategory,
        action: onOpenDSLEditor,
      }] : []),
    ]

    // Combine built-in commands with scripted commands
    const allCommands = [...commandList, ...scriptedCommands]

    return allCommands.filter((cmd) => !cmd.disabled)
  }, [
    router,
    storyStack,
    currentCard,
    storyCards,
    deleteCard,
    onAddCard,
    onAddCharacter,
    onPreview,
    onPublish,
    onTogglePreview,
    onExportStory,
    onDuplicateCard,
    onOpenScriptEditor,
    onOpenDSLEditor,
    scriptedCommands,
  ])

  return commands
}

export const categoryLabels: Record<CommandCategory, string> = {
  navigation: 'Navigation',
  cards: 'Cards',
  characters: 'Characters',
  story: 'Story',
  view: 'View',
  export: 'Export',
}

export const categoryOrder: CommandCategory[] = [
  'cards',
  'characters',
  'story',
  'view',
  'export',
  'navigation',
]
