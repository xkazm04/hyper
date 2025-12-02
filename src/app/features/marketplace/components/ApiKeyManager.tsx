'use client'

import { useState, useEffect } from 'react'
import { Key, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Modal, ModalHeader, ModalTitle, ModalDescription, ModalBody } from '@/components/ui/modal'
import { MarketplaceApiKey } from '@/lib/types'
import { useMarketplace } from '../lib/useMarketplace'
import { KeyList } from './sub_ApiKeyManager/KeyList'
import { KeyForm } from './sub_ApiKeyManager/KeyForm'
import { KeyUsage } from './sub_ApiKeyManager/KeyUsage'

export function ApiKeyManager() {
  const { getApiKeys, createApiKey, revokeApiKey, loading, error } = useMarketplace()

  const [apiKeys, setApiKeys] = useState<MarketplaceApiKey[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newKeyName, setNewKeyName] = useState('')
  const [selectedScopes, setSelectedScopes] = useState<string[]>(['read:assets'])
  const [createdKey, setCreatedKey] = useState<string | null>(null)

  useEffect(() => {
    loadApiKeys()
  }, [])

  const loadApiKeys = async () => {
    const keys = await getApiKeys()
    setApiKeys(keys)
  }

  const handleCreate = async () => {
    const result = await createApiKey(newKeyName, selectedScopes)
    if (result) {
      setCreatedKey(result.rawKey)
      setApiKeys([result.apiKey, ...apiKeys])
      setNewKeyName('')
      setSelectedScopes(['read:assets'])
    }
  }

  const handleRevoke = async (id: string) => {
    const success = await revokeApiKey(id)
    if (success) {
      setApiKeys(apiKeys.filter((k) => k.id !== id))
    }
  }

  const closeCreateDialog = () => {
    setShowCreateDialog(false)
    setCreatedKey(null)
  }

  const toggleScope = (scope: string) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope))
    } else {
      setSelectedScopes([...selectedScopes, scope])
    }
  }

  return (
    <Card data-testid="api-key-manager">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              API Keys
            </CardTitle>
            <CardDescription>
              Manage API keys for external service integration
            </CardDescription>
          </div>
          <Button onClick={() => setShowCreateDialog(true)} data-testid="create-api-key-btn">
            <Plus className="w-4 h-4 mr-2" />
            Create Key
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm mb-4">
            {error}
          </div>
        )}

        <KeyList apiKeys={apiKeys} onRevoke={handleRevoke} />
      </CardContent>

      {/* Create Key Modal */}
      <Modal open={showCreateDialog} onOpenChange={closeCreateDialog} size="md">
        <ModalHeader>
          <ModalTitle>
            {createdKey ? 'API Key Created' : 'Create New API Key'}
          </ModalTitle>
          <ModalDescription>
            {createdKey
              ? 'Copy this key now. It will not be shown again.'
              : 'Create an API key to access the marketplace from external services.'}
          </ModalDescription>
        </ModalHeader>

        <ModalBody data-testid="create-api-key-dialog">
          {createdKey ? (
            <KeyUsage createdKey={createdKey} onClose={closeCreateDialog} />
          ) : (
            <KeyForm
              newKeyName={newKeyName}
              setNewKeyName={setNewKeyName}
              selectedScopes={selectedScopes}
              onToggleScope={toggleScope}
              loading={loading}
              onCancel={closeCreateDialog}
              onCreate={handleCreate}
            />
          )}
        </ModalBody>
      </Modal>
    </Card>
  )
}
