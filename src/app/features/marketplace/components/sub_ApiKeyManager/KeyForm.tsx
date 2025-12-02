'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { ModalFooter } from '@/components/ui/modal'

interface KeyFormProps {
  newKeyName: string
  setNewKeyName: (value: string) => void
  selectedScopes: string[]
  onToggleScope: (scope: string) => void
  loading: boolean
  onCancel: () => void
  onCreate: () => void
}

const availableScopes = [
  { value: 'read:assets', label: 'Read Assets', description: 'View and search marketplace assets' },
  { value: 'embed:assets', label: 'Embed Assets', description: 'Get asset data for embedding' },
  { value: 'download:assets', label: 'Download Assets', description: 'Download and track asset usage' },
]

export function KeyForm({
  newKeyName,
  setNewKeyName,
  selectedScopes,
  onToggleScope,
  loading,
  onCancel,
  onCreate,
}: KeyFormProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="keyName">Key Name</Label>
        <Input
          id="keyName"
          value={newKeyName}
          onChange={(e) => setNewKeyName(e.target.value)}
          placeholder="My Integration"
          data-testid="key-name-input"
        />
      </div>

      <div className="space-y-2">
        <Label>Permissions</Label>
        <div className="space-y-2">
          {availableScopes.map((scope) => (
            <div key={scope.value} className="flex items-start gap-3">
              <Checkbox
                id={scope.value}
                checked={selectedScopes.includes(scope.value)}
                onCheckedChange={() => onToggleScope(scope.value)}
                data-testid={`scope-${scope.value}`}
              />
              <div className="grid gap-1">
                <Label htmlFor={scope.value} className="cursor-pointer">
                  {scope.label}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {scope.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <ModalFooter>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={onCreate}
          disabled={!newKeyName.trim() || selectedScopes.length === 0 || loading}
          data-testid="confirm-create-key-btn"
        >
          {loading ? 'Creating...' : 'Create Key'}
        </Button>
      </ModalFooter>
    </div>
  )
}
