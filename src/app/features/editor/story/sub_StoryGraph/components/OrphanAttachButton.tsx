'use client'

import { memo, useCallback, useState } from 'react'
import { Link2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

export interface OrphanAttachButtonProps {
  nodeId: string
  isOrphaned: boolean
  isHalloween: boolean
  onClick: (nodeId: string) => void
}

/**
 * OrphanAttachButton - Button shown on orphaned nodes to trigger attachment helper
 */
export const OrphanAttachButton = memo(function OrphanAttachButton({
  nodeId,
  isOrphaned,
  isHalloween,
  onClick,
}: OrphanAttachButtonProps) {
  const [isHovered, setIsHovered] = useState(false)

  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    onClick(nodeId)
  }, [nodeId, onClick])

  if (!isOrphaned) return null

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className={cn(
              'absolute -left-6 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-all',
              'border-2 shadow-sm hover:scale-110 active:scale-95',
              isHalloween
                ? 'bg-amber-500 border-amber-400 text-white hover:bg-amber-400 animate-pulse'
                : 'bg-amber-500 border-amber-400 text-white hover:bg-amber-400 animate-pulse',
              isHovered && 'scale-110 ring-2 ring-offset-2',
              isHovered && (isHalloween ? 'ring-orange-400' : 'ring-amber-400')
            )}
            data-testid={`orphan-attach-btn-${nodeId}`}
            aria-label="Find parent node to connect this orphan"
            title="Connect this orphan to a parent node"
          >
            <Link2 className="w-3 h-3" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="max-w-xs">
          <p className="font-medium">Connect Orphan Node</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click to see suggested parent nodes that can link to this scene
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
})

OrphanAttachButton.displayName = 'OrphanAttachButton'
