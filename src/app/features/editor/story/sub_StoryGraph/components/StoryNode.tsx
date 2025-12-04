import React, { memo, useCallback, useState, useMemo } from 'react'
import { NodeProps } from 'reactflow'
import { cn } from '@/lib/utils'
import { useTheme } from '@/hooks/useTheme'
import { GitBranch } from 'lucide-react'
import { useEditor } from '@/contexts/EditorContext'
import {
  Tooltip,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { buildNodeAriaLabel } from '../hooks/useStoryGraphNavigation'
import { PumpkinIcon, CompletionIndicators } from './NodeContent'
import { NodeConnectors } from './NodeConnectors'
import { NodeActions } from './NodeActions'
import { OrphanAttachButton } from './OrphanAttachButton'
import {
  NodeTooltip,
  getNodeStatus,
  getSelectionClasses,
  getFocusRingClasses
} from './sub_StoryNode'

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
  hasAudio: boolean
  choiceCount: number
  characters: string[]
  depth: number
  isCollapsed?: boolean
  hiddenDescendantCount?: number
  isOnPath?: boolean
  onOrphanAttach?: (nodeId: string) => void
  /** Whether this node is highlighted from search results */
  isSearchHighlighted?: boolean
  // Dynamic dimensions
  nodeWidth?: number
  nodeHeight?: number
  /** Whether this node is currently visible in the viewport (for lazy loading) */
  isViewportVisible?: boolean
}

/**
 * Custom comparison function for StoryNode memoization.
 * Only re-renders when data that affects the visual output changes.
 */
function arePropsEqual(
  prevProps: NodeProps<StoryNodeData>,
  nextProps: NodeProps<StoryNodeData>
): boolean {
  // Quick reference equality check
  if (prevProps === nextProps) return true

  // Check id and selected state
  if (prevProps.id !== nextProps.id || prevProps.selected !== nextProps.selected) {
    return false
  }

  const prev = prevProps.data
  const next = nextProps.data

  // Check all data properties that affect rendering
  return (
    prev.label === next.label &&
    prev.isFirst === next.isFirst &&
    prev.isOrphaned === next.isOrphaned &&
    prev.isDeadEnd === next.isDeadEnd &&
    prev.isIncomplete === next.isIncomplete &&
    prev.isSelected === next.isSelected &&
    prev.hasImage === next.hasImage &&
    prev.hasContent === next.hasContent &&
    prev.hasTitle === next.hasTitle &&
    prev.hasChoices === next.hasChoices &&
    prev.hasAudio === next.hasAudio &&
    prev.choiceCount === next.choiceCount &&
    prev.depth === next.depth &&
    prev.isCollapsed === next.isCollapsed &&
    prev.hiddenDescendantCount === next.hiddenDescendantCount &&
    prev.isOnPath === next.isOnPath &&
    prev.isSearchHighlighted === next.isSearchHighlighted &&
    prev.nodeWidth === next.nodeWidth &&
    prev.nodeHeight === next.nodeHeight &&
    prev.isViewportVisible === next.isViewportVisible
  )
}

/**
 * StoryNode - Redesigned for large-scale story maps (100+ nodes)
 *
 * Performance optimizations:
 * - Custom memo comparison for fine-grained re-render control
 * - CSS containment for layout isolation
 * - Memoized computed values
 * - Lazy content loading support via isViewportVisible
 */
const StoryNode = memo(function StoryNode({ data, selected, id }: NodeProps<StoryNodeData>) {
  const { theme } = useTheme()
  const { toggleNodeCollapsed } = useEditor()
  const isHalloween = theme === 'halloween'
  const ariaLabel = buildNodeAriaLabel(data)
  const [isBouncing, setIsBouncing] = useState(false)

  // Memoized callback to prevent unnecessary re-renders
  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      const target = event.target as HTMLElement
      target.click()
    }
  }, [])

  const handleCollapseToggle = useCallback((event: React.MouseEvent) => {
    event.stopPropagation()
    toggleNodeCollapsed(id)
  }, [id, toggleNodeCollapsed])

  // Optimized bounce animation with cleanup
  const handleClick = useCallback(() => {
    setIsBouncing(true)
    const timer = setTimeout(() => setIsBouncing(false), 350)
    return () => clearTimeout(timer)
  }, [])

  const {
    label, isFirst, isOrphaned, isDeadEnd, isSelected, hasImage,
    hasContent, hasTitle, hasChoices, hasAudio, choiceCount, characters, depth,
    isCollapsed = false, hiddenDescendantCount = 0, isOnPath = false,
    onOrphanAttach, nodeWidth, nodeHeight, isSearchHighlighted = false,
  } = data

  // Dynamic width style (default to 140px if not provided)
  const dynamicWidth = nodeWidth ?? 140

  const canCollapse = choiceCount > 0
  const completionItems = [hasTitle, hasContent, hasImage, hasChoices]
  const completionPercent = Math.round((completionItems.filter(Boolean).length / completionItems.length) * 100)
  const isComplete = completionPercent === 100

  const { statusBgClass, statusBorderClass, statusAccentClass, statusIcon, statusLabel } = 
    getNodeStatus({ isFirst, isOrphaned, isDeadEnd, isComplete, depth, isHalloween })

  const isNodeSelected = isSelected || selected
  const selectionClass = getSelectionClasses(isNodeSelected, isHalloween)
  const focusRingClass = getFocusRingClasses(isHalloween)

  return (
    <TooltipProvider delayDuration={400}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative rounded-lg border-2 transition-all duration-200 cursor-pointer group shadow-md',
              statusBgClass, statusBorderClass, statusAccentClass, selectionClass, focusRingClass,
              isHalloween && 'halloween-ghost-float',
              // Halloween dripping border effect
              isHalloween && 'halloween-drip-border',
              // Path glow animation for nodes on the ancestry path
              isOnPath && !isNodeSelected && 'path-node-glow',
              // Bounce animation on click
              isBouncing && 'node-click-bounce',
              // Search highlight styling
              isSearchHighlighted && 'search-highlight-glow'
            )}
            style={{ width: dynamicWidth, contain: 'layout style paint' }}
            tabIndex={0}
            role="treeitem"
            aria-label={ariaLabel}
            aria-selected={isNodeSelected}
            aria-level={data.depth >= 0 ? data.depth + 1 : undefined}
            data-node-id={id}
            data-testid={`story-node-${id}`}
            data-on-path={isOnPath}
            onKeyDown={handleKeyDown}
            onClick={handleClick}
          >
            {/* Colored top accent bar */}
            <div className={cn(
              'absolute top-0 left-2 right-2 h-0.5 rounded-b',
              isHalloween ? (
                isFirst ? 'bg-orange-500 animate-halloween-accent-glow' :
                isOrphaned ? 'bg-amber-500' : isDeadEnd ? 'bg-red-600' :
                isComplete ? 'bg-orange-400' : 'bg-purple-500/40'
              ) : (
                isFirst ? 'bg-primary' : isOrphaned ? 'bg-amber-500' :
                isDeadEnd ? 'bg-red-500' : isComplete ? 'bg-emerald-500' : 'bg-muted-foreground/30'
              )
            )} />

            {/* Header with status badge */}
            <div className="flex items-center gap-1 px-2 pt-2 pb-1">
              {statusIcon}
              <span className={cn(
                'text-[9px] font-bold uppercase tracking-wider',
                isHalloween ? (
                  isFirst ? 'text-orange-500' : isOrphaned ? 'text-amber-500' :
                  isDeadEnd ? 'text-red-500' : 'text-purple-300'
                ) : (
                  isFirst ? 'text-primary' : isOrphaned ? 'text-amber-600' :
                  isDeadEnd ? 'text-red-600' : 'text-muted-foreground'
                )
              )}>
                {statusLabel}
              </span>

              {/* Completion badge */}
              <div className="ml-auto">
                {isComplete ? (
                  isHalloween ? (
                    <span className="text-sm" role="img" aria-label="pumpkin">{String.fromCodePoint(0x1F383)}</span>
                  ) : (
                    <span className="w-3.5 h-3.5 text-emerald-500">✓</span>
                  )
                ) : (
                  <div className="flex items-center gap-0.5">
                    <div
                      className={cn("w-6 h-1.5 rounded-full overflow-hidden", isHalloween ? "bg-purple-900/50" : "bg-muted")}
                      title={`${completionPercent}% complete`}
                    >
                      <div
                        className={cn("h-full transition-all animate-progress-shimmer", isHalloween ? "bg-orange-500" : "bg-emerald-500")}
                        style={{ width: `${completionPercent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Main content - Title */}
            <div className="px-2 pb-1.5">
              <p className="text-xs font-semibold leading-tight line-clamp-2 text-foreground min-h-8">
                {label}
              </p>
            </div>

            {/* Footer with completion indicators and choice count */}
            <div className={cn(
              "flex items-center justify-between px-2 pb-2 pt-1 border-t",
              isHalloween ? "border-purple-500/20" : "border-border/30"
            )}>
              <CompletionIndicators
                hasTitle={hasTitle}
                hasContent={hasContent}
                hasImage={hasImage}
                hasChoices={hasChoices}
                isHalloween={isHalloween}
              />

              {choiceCount > 0 && (
                <div className={cn(
                  'flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium',
                  isHalloween ? (
                    choiceCount === 1 ? 'bg-purple-900/30 text-purple-300' :
                    choiceCount === 2 ? 'bg-orange-500/20 text-orange-400' : 'bg-red-500/20 text-red-400'
                  ) : (
                    choiceCount === 1 ? 'bg-muted text-muted-foreground' :
                    choiceCount === 2 ? 'bg-blue-500/10 text-blue-600' : 'bg-purple-500/10 text-purple-600'
                  )
                )}>
                  <GitBranch className="w-2.5 h-2.5" />
                  <span>{choiceCount}</span>
                </div>
              )}
            </div>

            <NodeConnectors choiceCount={choiceCount} isHalloween={isHalloween} isCollapsed={isCollapsed} />
            <NodeActions
              nodeId={id}
              canCollapse={canCollapse}
              isCollapsed={isCollapsed}
              hiddenDescendantCount={hiddenDescendantCount}
              isHalloween={isHalloween}
              onCollapseToggle={handleCollapseToggle}
            />
            {onOrphanAttach && (
              <OrphanAttachButton
                nodeId={id}
                isOrphaned={isOrphaned}
                isHalloween={isHalloween}
                onClick={onOrphanAttach}
              />
            )}
          </div>
        </TooltipTrigger>

        <NodeTooltip
          label={label}
          statusIcon={statusIcon}
          statusLabel={statusLabel}
          isFirst={isFirst}
          isOrphaned={isOrphaned}
          isDeadEnd={isDeadEnd}
          hasTitle={hasTitle}
          hasContent={hasContent}
          hasImage={hasImage}
          hasChoices={hasChoices}
          hasAudio={hasAudio}
          characters={characters}
          depth={depth}
          choiceCount={choiceCount}
        />
      </Tooltip>
    </TooltipProvider>
  )
}, arePropsEqual)

StoryNode.displayName = 'StoryNode'
export default StoryNode
