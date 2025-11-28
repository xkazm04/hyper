'use client'

import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { CharacterAsset } from '@/lib/types'

interface ApprovalActionsProps {
  reviewAsset: CharacterAsset | null
  reviewStatus: 'approved' | 'rejected' | 'needs_changes'
  reviewNotes: string
  setReviewNotes: (notes: string) => void
  submitting: boolean
  onClose: () => void
  onConfirm: () => void
}

const assetTypeLabels: Record<string, string> = {
  character: 'Character',
  prompt_template: 'Prompt Template',
  avatar_set: 'Avatar Set',
  character_pack: 'Character Pack',
}

export function ApprovalActions({
  reviewAsset,
  reviewStatus,
  reviewNotes,
  setReviewNotes,
  submitting,
  onClose,
  onConfirm,
}: ApprovalActionsProps) {
  return (
    <Dialog open={!!reviewAsset} onOpenChange={onClose}>
      <DialogContent data-testid="review-dialog">
        <DialogHeader>
          <DialogTitle>
            {reviewStatus === 'approved' && 'Approve Asset'}
            {reviewStatus === 'rejected' && 'Reject Asset'}
            {reviewStatus === 'needs_changes' && 'Request Changes'}
          </DialogTitle>
          <DialogDescription>
            {reviewStatus === 'approved' && 'This asset will be published to the marketplace.'}
            {reviewStatus === 'rejected' && 'This asset will be rejected and the creator will be notified.'}
            {reviewStatus === 'needs_changes' && 'The creator will be asked to make changes before resubmitting.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {reviewAsset && (
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              {reviewAsset.thumbnailUrl && (
                <img
                  src={reviewAsset.thumbnailUrl}
                  alt={reviewAsset.name}
                  className="w-12 h-12 rounded object-cover"
                />
              )}
              <div>
                <div className="font-medium">{reviewAsset.name}</div>
                <div className="text-sm text-muted-foreground">
                  {assetTypeLabels[reviewAsset.assetType]}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">
              {reviewStatus === 'approved' ? 'Notes (optional)' : 'Notes for creator'}
            </Label>
            <Textarea
              id="notes"
              value={reviewNotes}
              onChange={(e) => setReviewNotes(e.target.value)}
              placeholder={
                reviewStatus === 'approved'
                  ? 'Add any notes...'
                  : 'Explain what needs to be changed...'
              }
              rows={3}
              data-testid="review-notes-input"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            disabled={submitting || (reviewStatus !== 'approved' && !reviewNotes.trim())}
            variant={reviewStatus === 'rejected' ? 'destructive' : 'default'}
            className={reviewStatus === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
            data-testid="confirm-review-btn"
          >
            {submitting ? 'Submitting...' : (
              <>
                {reviewStatus === 'approved' && 'Approve'}
                {reviewStatus === 'rejected' && 'Reject'}
                {reviewStatus === 'needs_changes' && 'Request Changes'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
