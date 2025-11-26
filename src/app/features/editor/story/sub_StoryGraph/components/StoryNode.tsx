import React, { memo } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  AlertTriangle,
  Play,
  ImageIcon,
  FileText,
  GitBranch,
  CheckCircle2,
  Circle,
  Type,
} from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface StoryNodeData {
  label: string
  isFirst: boolean
  isOrphaned: boolean
  isDeadEnd: boolean
  isIncomplete: boolean
  isSelected: boolean
  hasImage: boolean
  hasContent: boolean
  hasTitle: boolean
  hasChoices: boolean
  choiceCount: number
  characters: string[]
  depth: number
}

/**
 * Compact completion indicator with icons
 * Designed for quick visual scanning of node status
 */
function CompletionIndicators({
  hasTitle,
  hasContent,
  hasImage,
  hasChoices,
}: {
  hasTitle: boolean
  hasContent: boolean
  hasImage: boolean
  hasChoices: boolean
}) {
  const indicators = [
    { done: hasTitle, icon: Type, label: 'Title' },
    { done: hasContent, icon: FileText, label: 'Content' },
    { done: hasImage, icon: ImageIcon, label: 'Image' },
    { done: hasChoices, icon: GitBranch, label: 'Choices' },
  ]

  return (
    <div className="flex items-center gap-1">
      {indicators.map(({ done, icon: Icon, label }, i) => (
        <div
          key={i}
          className={cn(
            'w-4 h-4 rounded flex items-center justify-center transition-colors',
            done
              ? 'bg-emerald-500/20 text-emerald-600'
              : 'bg-muted text-muted-foreground/50'
          )}
          title={`${label}: ${done ? 'Done' : 'Missing'}`}
        >
          <Icon className="w-2.5 h-2.5" />
        </div>
      ))}
    </div>
  )
}

/**
 * StoryNode - Redesigned for large-scale story maps (100+ nodes)
 *
 * Design principles:
 * - Compact but informative
 * - Clear visual hierarchy (status > title > completion)
 * - High contrast status indicators
 * - Minimal but functional handles for connections
 */
const StoryNode = memo(({ data, selected }: NodeProps<StoryNodeData>) => {
  const {
    label,
    isFirst,
    isOrphaned,
    isDeadEnd,
    isIncomplete,
    isSelected,
    hasImage,
    hasContent,
    hasTitle,
    hasChoices,
    choiceCount,
    characters,
    depth,
  } = data

  // Calculate completion percentage
  const completionItems = [hasTitle, hasContent, hasImage, hasChoices]
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)
  const isComplete = completionPercent === 100

  // Determine node status and styling - priority order matters
  let statusBgClass = 'bg-card'
  let statusBorderClass = 'border-border'
  let statusAccentClass = ''
  let statusIcon = null
  let statusLabel = depth >= 0 ? `Level ${depth}` : 'Scene'

  if (isFirst) {
    statusBgClass = 'bg-primary/5'
    statusBorderClass = 'border-primary'
    statusAccentClass = 'shadow-[0_0_0_1px_hsl(var(--primary)/0.3)]'
    statusIcon = <Play className="w-3 h-3 text-primary fill-primary" />
    statusLabel = 'START'
  } else if (isOrphaned) {
    statusBgClass = 'bg-amber-500/5'
    statusBorderClass = 'border-amber-500'
    statusAccentClass = 'shadow-[0_0_0_1px_hsl(45,93%,47%,0.3)]'
    statusIcon = <AlertTriangle className="w-3 h-3 text-amber-500" />
    statusLabel = 'Orphaned'
  } else if (isDeadEnd) {
    statusBgClass = 'bg-red-500/5'
    statusBorderClass = 'border-red-500'
    statusAccentClass = 'shadow-[0_0_0_1px_hsl(0,84%,60%,0.3)]'
    statusIcon = <AlertCircle className="w-3 h-3 text-red-500" />
    statusLabel = 'Dead End'
  } else if (isComplete) {
    statusBgClass = 'bg-emerald-500/5'
    statusBorderClass = 'border-emerald-500/50'
    statusAccentClass = ''
  }

  // Selection state with prominent visual feedback
  const isNodeSelected = isSelected || selected
  const selectionClass = isNodeSelected
    ? 'ring-2 ring-primary ring-offset-2 ring-offset-background shadow-xl scale-105 z-50'
    : 'hover:shadow-lg hover:scale-[1.02] hover:z-10'

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative w-[140px] rounded-lg border-2 transition-all duration-200 cursor-pointer',
              'shadow-md',
              statusBgClass,
              statusBorderClass,
              statusAccentClass,
              selectionClass
            )}
          >
            {/* Colored top accent bar based on status */}
            <div
              className={cn(
                'absolute top-0 left-2 right-2 h-0.5 rounded-b',
                isFirst && 'bg-primary',
                isOrphaned && 'bg-amber-500',
                isDeadEnd && 'bg-red-500',
                isComplete && !isFirst && !isOrphaned && !isDeadEnd && 'bg-emerald-500',
                !isFirst && !isOrphaned && !isDeadEnd && !isComplete && 'bg-muted-foreground/30'
              )}
            />

            {/* Header with status badge */}
            <div className="flex items-center gap-1 px-2 pt-2 pb-1">
              {statusIcon}
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wider',
                isFirst && 'text-primary',
                isOrphaned && 'text-amber-600',
                isDeadEnd && 'text-red-600',
                !isFirst && !isOrphaned && !isDeadEnd && 'text-muted-foreground'
              )}>
                {statusLabel}
              </span>

              {/* Completion badge - top right */}
              <div className="ml-auto">
                {isComplete ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <div className="flex items-center gap-0.5">
                    <div
                      className="w-6 h-1.5 bg-muted rounded-full overflow-hidden"
                      title={`${completionPercent}% complete`}
                    >
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main content - Title */}
            <div className="px-2 pb-1.5">
              <p className="text-xs font-semibold leading-tight line-clamp-2 text-foreground min-h-[2rem]">
                {label}
              </p>
            </div>

            {/* Footer with completion indicators and choice count */}
            <div className="flex items-center justify-between px-2 pb-2 pt-1 border-t border-border/30">
              <CompletionIndicators
                hasTitle={hasTitle}
                hasContent={hasContent}
                hasImage={hasImage}
                hasChoices={hasChoices}
              />

              {/* Choice count badge - important for decision tree viz */}
              {choiceCount > 0 && (
                <div className={cn(
                  'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
                  choiceCount === 1 && 'bg-muted text-muted-foreground',
                  choiceCount === 2 && 'bg-blue-500/10 text-blue-600',
                  choiceCount >= 3 && 'bg-purple-500/10 text-purple-600'
                )}>
                  <GitBranch className="w-2.5 h-2.5" />
                  <span>{choiceCount}</span>
                </div>
              )}
            </div>

            {/* Connection Handles - styled for visibility */}
            <Handle
              type="target"
              position={Position.Left}
              className={cn(
                '!w-3 !h-3 !border-2 !rounded-full transition-colors',
                '!-left-1.5',
                '!bg-card !border-border',
                'hover:!bg-primary hover:!border-primary'
              )}
            />
            <Handle
              type="source"
              position={Position.Right}
              className={cn(
                '!w-3 !h-3 !border-2 !rounded-full transition-colors',
                '!-right-1.5',
                choiceCount > 0
                  ? '!bg-primary/20 !border-primary'
                  : '!bg-muted !border-muted-foreground/30',
                'hover:!bg-primary hover:!border-primary'
              )}
            />

            {/* Multi-branch indicator dots for source handle */}
            {choiceCount > 1 && (
              <div className="absolute -right-1 top-1/2 -translate-y-1/2 translate-x-full flex flex-col gap-0.5 ml-1">
                {Array.from({ length: Math.min(choiceCount, 3) }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-1 rounded-full bg-primary/60"
                  />
                ))}
              </div>
            )}
          </div>
        </TooltipTrigger>

        {/* Detailed Tooltip for hover inspection */}
        <TooltipContent
          side="right"
          sideOffset={16}
          className="max-w-[280px] p-0 bg-card border-2 border-border shadow-xl rounded-lg overflow-hidden"
        >
          <div className="p-3 space-y-2.5">
            {/* Title with status badge */}
            <div className="flex items-start gap-2">
              {statusIcon && (
                <div className={cn(
                  'p-1 rounded',
                  isFirst && 'bg-primary/10',
                  isOrphaned && 'bg-amber-500/10',
                  isDeadEnd && 'bg-red-500/10'
                )}>
                  {statusIcon}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight">{label}</p>
                {(isFirst || isOrphaned || isDeadEnd) && (
                  <p className={cn(
                    'text-xs mt-0.5',
                    isFirst && 'text-primary',
                    isOrphaned && 'text-amber-600',
                    isDeadEnd && 'text-red-600'
                  )}>
                    {statusLabel}
                  </p>
                )}
              </div>
            </div>

            {/* Completion grid */}
            <div className="grid grid-cols-2 gap-1.5">
              <CompletionItem done={hasTitle} label="Title" icon={Type} />
              <CompletionItem done={hasContent} label="Content" icon={FileText} />
              <CompletionItem done={hasImage} label="Image" icon={ImageIcon} />
              <CompletionItem done={hasChoices} label="Choices" icon={GitBranch} />
            </div>

            {/* Characters if present */}
            {characters && characters.length > 0 && (
              <div className="text-xs pt-1.5 border-t border-border/50">
                <span className="font-medium text-muted-foreground">Characters: </span>
                <span className="text-foreground">{characters.join(', ')}</span>
              </div>
            )}

            {/* Depth and branches info */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1.5 border-t border-border/50">
              {depth >= 0 && (
                <span>Depth: {depth}</span>
              )}
              {choiceCount > 0 && (
                <span className="flex items-center gap-1">
                  <GitBranch className="w-3 h-3" />
                  {choiceCount} {choiceCount === 1 ? 'choice' : 'choices'}
                </span>
              )}
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

function CompletionItem({
  done,
  label,
  icon: Icon
}: {
  done: boolean
  label: string
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className={cn(
      'flex items-center gap-1.5 px-2 py-1 rounded text-xs',
      done ? 'bg-emerald-500/10 text-emerald-600' : 'bg-muted text-muted-foreground'
    )}>
      {done ? (
        <CheckCircle2 className="w-3 h-3" />
      ) : (
        <Circle className="w-3 h-3" />
      )}
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </div>
  )
}

StoryNode.displayName = 'StoryNode'
export default StoryNode
