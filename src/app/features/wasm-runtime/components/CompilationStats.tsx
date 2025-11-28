'use client'

import { FileCode, Clock, HardDrive, Layers, Zap, Image } from 'lucide-react'
import type { CompileStats } from '../lib/types'
import { formatBytes, formatDuration } from '../lib/utils'

interface CompilationStatsProps {
  stats: CompileStats
}

export function CompilationStats({ stats }: CompilationStatsProps) {
  const compressionPercent = Math.round((1 - stats.dataCompressionRatio) * 100)

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 gap-3"
      data-testid="compilation-stats"
    >
      <StatCard
        icon={<Layers className="w-4 h-4" />}
        label="Cards"
        value={stats.totalCards.toString()}
        testId="stat-cards"
      />
      <StatCard
        icon={<Zap className="w-4 h-4" />}
        label="Choices"
        value={stats.totalChoices.toString()}
        testId="stat-choices"
      />
      <StatCard
        icon={<Image className="w-4 h-4" />}
        label="Assets"
        value={stats.totalAssets.toString()}
        testId="stat-assets"
      />
      <StatCard
        icon={<HardDrive className="w-4 h-4" />}
        label="Bundle Size"
        value={formatBytes(stats.bundleSizeBytes)}
        testId="stat-bundle-size"
      />
      <StatCard
        icon={<Clock className="w-4 h-4" />}
        label="Compile Time"
        value={`${Math.round(stats.compileDurationMs)}ms`}
        testId="stat-compile-time"
      />
      <StatCard
        icon={<FileCode className="w-4 h-4" />}
        label="Compression"
        value={compressionPercent > 0 ? `${compressionPercent}%` : 'N/A'}
        testId="stat-compression"
      />
    </div>
  )
}

interface StatCardProps {
  icon: React.ReactNode
  label: string
  value: string
  testId: string
}

function StatCard({ icon, label, value, testId }: StatCardProps) {
  return (
    <div
      className="p-2.5 bg-muted/50 rounded-lg border border-border"
      data-testid={testId}
    >
      <div className="flex items-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <div className="font-semibold text-foreground text-sm">{value}</div>
    </div>
  )
}
