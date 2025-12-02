'use client'

import { useState } from 'react'
import { Copy, Check, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ModalFooter } from '@/components/ui/modal'

interface KeyUsageProps {
  createdKey: string
  onClose: () => void
}

export function KeyUsage({ createdKey, onClose }: KeyUsageProps) {
  const [copied, setCopied] = useState(false)
  const [showKey, setShowKey] = useState(false)

  const copyKey = () => {
    navigator.clipboard.writeText(createdKey)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
        <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
        <p className="text-sm text-yellow-600 dark:text-yellow-400">
          Save this key securely. It will only be shown once!
        </p>
      </div>
      <div className="relative">
        <Input
          value={showKey ? createdKey : '•'.repeat(createdKey.length)}
          readOnly
          className="font-mono pr-20"
          data-testid="created-key-input"
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowKey(!showKey)}
            className="h-7 w-7"
            data-testid="toggle-key-visibility"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={copyKey}
            className="h-7 w-7"
            data-testid="copy-key-btn"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </Button>
        </div>
      </div>
      <ModalFooter>
        <Button onClick={onClose} data-testid="close-dialog-btn">
          Done
        </Button>
      </ModalFooter>
    </div>
  )
}
