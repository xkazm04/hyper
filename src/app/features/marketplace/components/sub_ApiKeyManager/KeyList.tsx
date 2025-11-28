'use client'

import { Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MarketplaceApiKey } from '@/lib/types'

interface KeyListProps {
  apiKeys: MarketplaceApiKey[]
  onRevoke: (id: string) => void
}

export function KeyList({ apiKeys, onRevoke }: KeyListProps) {
  if (apiKeys.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No API keys yet. Create one to integrate with external services.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {apiKeys.map((key) => (
        <div
          key={key.id}
          className="flex items-center justify-between p-4 border rounded-lg"
          data-testid={`api-key-${key.id}`}
        >
          <div className="space-y-1">
            <div className="font-medium">{key.name}</div>
            <div className="text-sm text-muted-foreground font-mono">
              {key.keyPrefix}...
            </div>
            <div className="flex gap-1">
              {key.scopes.map((scope) => (
                <Badge key={scope} variant="secondary" className="text-xs">
                  {scope}
                </Badge>
              ))}
            </div>
            <div className="text-xs text-muted-foreground">
              Created: {new Date(key.createdAt).toLocaleDateString()}
              {key.lastUsedAt && (
                <> • Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</>
              )}
              {key.expiresAt && (
                <> • Expires: {new Date(key.expiresAt).toLocaleDateString()}</>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onRevoke(key.id)}
            className="text-destructive hover:text-destructive"
            data-testid={`revoke-key-${key.id}`}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
