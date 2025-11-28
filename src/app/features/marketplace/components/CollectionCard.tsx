'use client'

import { Sparkles, TrendingUp, Clock, Star } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CuratedCollection } from '@/lib/types'

interface CollectionCardProps {
  collection: CuratedCollection
  onClick?: () => void
}

export function CollectionCard({ collection, onClick }: CollectionCardProps) {
  const collectionTypeIcons: Record<string, React.ReactNode> = {
    featured: <Sparkles className="w-4 h-4" />,
    staff_picks: <Star className="w-4 h-4" />,
    themed: null,
    seasonal: <Clock className="w-4 h-4" />,
    new_creators: <TrendingUp className="w-4 h-4" />,
  }

  const collectionTypeLabels: Record<string, string> = {
    featured: 'Featured',
    staff_picks: 'Staff Picks',
    themed: 'Themed',
    seasonal: 'Seasonal',
    new_creators: 'New Creators',
  }

  return (
    <Card
      className="overflow-hidden cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02] group"
      onClick={onClick}
      data-testid={`collection-card-${collection.id}`}
    >
      <div className="aspect-video relative bg-gradient-to-br from-primary/20 to-primary/5">
        {collection.thumbnailUrl ? (
          <img
            src={collection.thumbnailUrl}
            alt={collection.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-6xl opacity-20">
              {collectionTypeIcons[collection.collectionType] || <Sparkles />}
            </div>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <Badge
            variant="secondary"
            className="mb-2 bg-white/20 text-white border-none"
          >
            {collectionTypeIcons[collection.collectionType]}
            <span className="ml-1">{collectionTypeLabels[collection.collectionType]}</span>
          </Badge>
          <h3 className="font-bold text-xl text-white group-hover:underline">
            {collection.name}
          </h3>
        </div>
      </div>

      <CardContent className="p-4">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {collection.description}
        </p>
      </CardContent>
    </Card>
  )
}
