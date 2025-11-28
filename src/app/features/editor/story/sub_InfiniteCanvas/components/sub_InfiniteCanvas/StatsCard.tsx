'use client'

import { MapPin, Play, Circle, AlertTriangle, AlertCircle } from 'lucide-react'

interface CanvasStats {
  total: number
  orphaned: number
  deadEnds: number
  incomplete: number
  complete: number
  suggestions: number
}

interface StatsCardProps {
  stats: CanvasStats
}

export function StatsCard({ stats }: StatsCardProps) {
  return (
    <div className="bg-card/95 border-2 border-border rounded-lg p-3 shadow-lg backdrop-blur-sm w-full">
      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-border">
        <MapPin className="w-4 h-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">Story Map</h3>
        <span className="ml-auto text-xs text-muted-foreground font-medium">
          {stats.total} scenes
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Completion</span>
          <span className="font-semibold text-foreground">
            {stats.total > 0 ? Math.round((stats.complete / stats.total) * 100) : 0}%
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-linear-to-r from-emerald-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${stats.total > 0 ? (stats.complete / stats.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <LegendItem icon={<Play className="w-3 h-3" />} label="Start" color="bg-primary" borderColor="border-primary" />
        <LegendItem icon={<Circle className="w-3 h-3" />} label="Scene" color="bg-card" borderColor="border-border" />
        <LegendItem icon={<AlertTriangle className="w-3 h-3" />} label={`Orphaned (${stats.orphaned})`} color="bg-amber-500/20" borderColor="border-amber-500" alert={stats.orphaned > 0} />
        <LegendItem icon={<AlertCircle className="w-3 h-3" />} label={`Dead End (${stats.deadEnds})`} color="bg-red-500/20" borderColor="border-red-500" alert={stats.deadEnds > 0} />
      </div>
    </div>
  )
}

function LegendItem({ icon, label, color, borderColor, alert = false }: {
  icon: React.ReactNode; label: string; color: string; borderColor: string; alert?: boolean
}) {
  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded ${alert ? 'bg-destructive/10' : ''}`}>
      <div className={`w-4 h-4 rounded-sm border-2 ${color} ${borderColor} flex items-center justify-center`}>
        {icon}
      </div>
      <span className={`text-xs ${alert ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
        {label}
      </span>
    </div>
  )
}
