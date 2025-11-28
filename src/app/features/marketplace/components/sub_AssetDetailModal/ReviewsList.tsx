'use client'

import { useState, useEffect } from 'react'
import { Star, User, Calendar, ThumbsUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CharacterAsset, AssetReview } from '@/lib/types'
import { useMarketplace } from '../../lib/useMarketplace'

interface ReviewsListProps {
  asset: CharacterAsset
}

export function ReviewsList({ asset }: ReviewsListProps) {
  const { getReviews, createReview, loading } = useMarketplace()
  const [reviews, setReviews] = useState<AssetReview[]>([])
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newRating, setNewRating] = useState(5)
  const [newReviewText, setNewReviewText] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [asset.id])

  const loadReviews = async () => {
    const data = await getReviews(asset.id)
    setReviews(data || [])
  }

  const handleSubmitReview = async () => {
    if (!newRating) return

    setSubmitting(true)
    try {
      const review = await createReview(
        asset.id,
        newRating,
        newReviewText.trim() || undefined
      )
      if (review) {
        setReviews([review, ...reviews])
        setShowReviewForm(false)
        setNewRating(5)
        setNewReviewText('')
      }
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
  }

  const renderStars = (rating: number, interactive = false) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            className={`${interactive ? 'cursor-pointer hover:scale-110' : ''} transition-transform`}
            onClick={() => interactive && setNewRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            data-testid={interactive ? `star-${star}` : undefined}
          >
            <Star
              className={`w-5 h-5 ${
                star <= (interactive ? (hoverRating || newRating) : rating)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Rating Summary */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            <span className="text-lg font-bold">{asset.rating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">
            ({asset.ratingCount} {asset.ratingCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>
        {!showReviewForm && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowReviewForm(true)}
            data-testid="write-review-btn"
          >
            Write a Review
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showReviewForm && (
        <Card className="border-primary/50">
          <CardContent className="pt-4 space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              {renderStars(newRating, true)}
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
              <Textarea
                value={newReviewText}
                onChange={(e) => setNewReviewText(e.target.value)}
                placeholder="Share your experience with this asset..."
                className="min-h-[80px]"
                data-testid="review-text-input"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowReviewForm(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitReview}
                disabled={submitting || !newRating}
                data-testid="submit-review-btn"
              >
                {submitting ? 'Submitting...' : 'Submit Review'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-3">
        {reviews.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            No reviews yet. Be the first to review!
          </div>
        ) : (
          reviews.map((review) => (
            <Card key={review.id} data-testid={`review-${review.id}`}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                      <User className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        {renderStars(review.rating)}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(review.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
                {review.reviewText && (
                  <p className="text-sm text-muted-foreground mt-2">{review.reviewText}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
