'use client'

import { Globe, FileCode, FileJson, Package } from 'lucide-react'
import type { ExportFormat } from '../lib/types'

interface ExportFormatSelectorProps {
  selectedFormat: ExportFormat
  onFormatChange: (format: ExportFormat) => void
}

interface FormatOption {
  value: ExportFormat
  label: string
  description: string
  icon: React.ReactNode
  recommended?: boolean
}

const FORMAT_OPTIONS: FormatOption[] = [
  {
    value: 'html-bundle',
    label: 'HTML Bundle',
    description: 'Self-contained HTML file with embedded player. Open in any browser.',
    icon: <Globe className="w-5 h-5" />,
    recommended: true,
  },
  {
    value: 'json-bundle',
    label: 'JSON Data',
    description: 'Raw story data in JSON format. For custom integrations.',
    icon: <FileJson className="w-5 h-5" />,
  },
  {
    value: 'wasm-standalone',
    label: 'WASM Binary',
    description: 'Compiled WebAssembly module. For embedding in web apps.',
    icon: <Package className="w-5 h-5" />,
  },
]

export function ExportFormatSelector({
  selectedFormat,
  onFormatChange,
}: ExportFormatSelectorProps) {
  return (
    <div className="space-y-3" data-testid="export-format-selector">
      <label className="text-sm font-medium text-foreground">Export Format</label>
      <div className="space-y-2">
        {FORMAT_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onFormatChange(option.value)}
            className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
              selectedFormat === option.value
                ? 'border-primary bg-primary/10 shadow-[2px_2px_0px_0px_hsl(var(--primary))]'
                : 'border-border bg-card hover:bg-muted/50 hover:shadow-[2px_2px_0px_0px_hsl(var(--border))]'
            }`}
            data-testid={`export-format-${option.value}`}
          >
            <div className="flex items-start gap-3">
              <div
                className={`p-1.5 rounded ${
                  selectedFormat === option.value
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {option.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      selectedFormat === option.value
                        ? 'text-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {option.label}
                  </span>
                  {option.recommended && (
                    <span className="text-xs px-1.5 py-0.5 bg-primary/20 text-primary rounded-full font-medium">
                      Recommended
                    </span>
                  )}
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    selectedFormat === option.value
                      ? 'text-muted-foreground'
                      : 'text-muted-foreground/70'
                  }`}
                >
                  {option.description}
                </p>
              </div>
              <div
                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                  selectedFormat === option.value
                    ? 'border-primary bg-primary'
                    : 'border-muted-foreground/30'
                }`}
              >
                {selectedFormat === option.value && (
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-foreground" />
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
