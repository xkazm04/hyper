'use client'

import { cn } from '@/lib/utils'

interface ContrastInfo {
  tokenName: string
  ratio: number
  meetsAA: boolean
}

interface ContrastMetricsProps {
  contrastAnalysis: ContrastInfo[]
}

/**
 * ContrastMetrics - Grid display of contrast ratio information for each token pair
 */
export function ContrastMetrics({ contrastAnalysis }: ContrastMetricsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
      {contrastAnalysis.slice(0, 4).map((info) => (
        <div
          key={info.tokenName}
          className={cn(
            'p-2 rounded border text-xs',
            info.meetsAA
              ? 'border-green-500/30 bg-green-50/50 dark:bg-green-950/20'
              : 'border-yellow-500/30 bg-yellow-50/50 dark:bg-yellow-950/20'
          )}
          data-testid={`contrast-info-${info.tokenName.replace('/', '-')}`}
        >
          <div className="font-medium text-foreground truncate">
            {info.tokenName.split('/')[0]}
          </div>
          <div className={cn(
            'font-mono',
            info.meetsAA ? 'text-green-600' : 'text-yellow-600'
          )}>
            {info.ratio.toFixed(2)}:1
          </div>
          <div className="text-muted-foreground">
            {info.meetsAA ? 'AA Pass' : 'AA Fail'}
          </div>
        </div>
      ))}
    </div>
  )
}
