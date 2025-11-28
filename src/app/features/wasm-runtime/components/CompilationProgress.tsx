'use client'

import { Loader2 } from 'lucide-react'

export function CompilationProgress() {
  return (
    <div
      className="p-6 bg-muted/50 rounded-lg border-2 border-border text-center"
      data-testid="compilation-progress"
    >
      <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
      <h4 className="mt-3 font-medium text-foreground">Compiling your story...</h4>
      <p className="text-sm text-muted-foreground mt-1">
        Building navigation graph and bundling assets
      </p>
      <div className="mt-4 space-y-2">
        <ProgressStep step="Serializing story data" status="complete" />
        <ProgressStep step="Building navigation graph" status="active" />
        <ProgressStep step="Processing assets" status="pending" />
        <ProgressStep step="Creating bundle" status="pending" />
      </div>
    </div>
  )
}

interface ProgressStepProps {
  step: string
  status: 'pending' | 'active' | 'complete'
}

function ProgressStep({ step, status }: ProgressStepProps) {
  return (
    <div
      className={`flex items-center gap-2 text-sm ${
        status === 'complete'
          ? 'text-green-600'
          : status === 'active'
            ? 'text-primary font-medium'
            : 'text-muted-foreground'
      }`}
      data-testid={`progress-step-${status}`}
    >
      <div
        className={`w-2 h-2 rounded-full ${
          status === 'complete'
            ? 'bg-green-600'
            : status === 'active'
              ? 'bg-primary animate-pulse'
              : 'bg-muted-foreground/30'
        }`}
      />
      <span>{step}</span>
    </div>
  )
}
