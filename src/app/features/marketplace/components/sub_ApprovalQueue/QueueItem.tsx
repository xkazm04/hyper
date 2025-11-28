'use client'

import { Check, X, MessageSquare, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CharacterAsset } from '@/lib/types'

interface QueueItemProps {
  asset: CharacterAsset
  onPreview: (asset: CharacterAsset) => void
  onReview: (asset: CharacterAsset, status: 'approved' | 'rejected' | 'needs_changes') => void
}

const assetTypeLabels: Record<string, string> = {
  character: 'Character',
  prompt_template: 'Prompt Template',
  avatar_set: 'Avatar Set',
  character_pack: 'Character Pack',
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'pending_review':
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Pending Review</Badge>
    case 'approved':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Approved</Badge>
    case 'rejected':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Rejected</Badge>
    case 'needs_changes':
      return <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">Needs Changes</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

export function QueueItem({ asset, onPreview, onReview }: QueueItemProps) {
  return (
    <div
      className="flex items-start gap-4 p-4 border rounded-lg"
      data-testid={`queue-item-${asset.id}`}
    >
      {/* Thumbnail */}
      <div className="w-20 h-20 bg-muted rounded-md overflow-hidden shrink-0">
        {asset.thumbnailUrl ? (
          <img
            src={asset.thumbnailUrl}
            alt={asset.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
            No image
          </div>
        )}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h4 className="font-medium truncate">{asset.name}</h4>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {asset.description}
            </p>
          </div>
          {getStatusBadge(asset.approvalStatus)}
        </div>

        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
          <Badge variant="secondary" className="text-xs">
            {assetTypeLabels[asset.assetType]}
          </Badge>
          <span>•</span>
          <span className="capitalize">{asset.category}</span>
          <span>•</span>
          <span>Submitted {new Date(asset.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPreview(asset)}
            data-testid={`preview-${asset.id}`}
          >
            <Eye className="w-4 h-4 mr-1" />
            Preview
          </Button>
          <Button
            variant="default"
            size="sm"
            className="bg-green-600 hover:bg-green-700"
            onClick={() => onReview(asset, 'approved')}
            data-testid={`approve-${asset.id}`}
          >
            <Check className="w-4 h-4 mr-1" />
            Approve
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onReview(asset, 'needs_changes')}
            data-testid={`needs-changes-${asset.id}`}
          >
            <MessageSquare className="w-4 h-4 mr-1" />
            Request Changes
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => onReview(asset, 'rejected')}
            data-testid={`reject-${asset.id}`}
          >
            <X className="w-4 h-4 mr-1" />
            Reject
          </Button>
        </div>
      </div>
    </div>
  )
}
