# Phase 6: Publishing & Sharing

## Objective
Implement stack publishing, public sharing, embedding capabilities, and a public stack gallery.

## Tasks

### 6.1 Stack Publishing Features

**Update Stack Schema** - Add to existing migration or create new one:

```sql
-- Add publishing fields
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create index for slugs
CREATE INDEX IF NOT EXISTS idx_stacks_slug ON stacks(slug) WHERE slug IS NOT NULL;

-- Create index for featured stacks
CREATE INDEX IF NOT EXISTS idx_stacks_featured ON stacks(featured) WHERE featured = true;

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_stack_slug(stack_name TEXT, stack_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(stack_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If slug is empty, use stack_id
  IF base_slug = '' THEN
    base_slug := 'stack';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM stacks WHERE slug = final_slug AND id != stack_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
```

**Update Stack Types**: `lib/types/index.ts`

```typescript
export interface Stack {
  // ... existing fields
  slug?: string | null
  viewCount: number
  featured: boolean
  tags: string[]
}

export interface PublishStackInput {
  isPublic: boolean
  tags?: string[]
}
```

### 6.2 Publishing Service

**Publishing Service**: `lib/services/publishing.ts`

```typescript
import { createClient } from '@/lib/supabase/client'
import { Stack } from '@/lib/types'

export class PublishingService {
  private supabase = createClient()

  async publishStack(stackId: string, tags: string[] = []): Promise<Stack> {
    // Generate slug if not exists
    const { data: stack } = await this.supabase
      .from('stacks')
      .select('name, slug')
      .eq('id', stackId)
      .single()

    let slug = stack?.slug
    if (!slug) {
      const { data } = await this.supabase.rpc('generate_stack_slug', {
        stack_name: stack?.name || 'Untitled',
        stack_id: stackId,
      })
      slug = data
    }

    // Update stack to public
    const { data, error } = await this.supabase
      .from('stacks')
      .update({
        is_public: true,
        published_at: new Date().toISOString(),
        slug: slug,
        tags: tags,
      })
      .eq('id', stackId)
      .select()
      .single()

    if (error) throw error

    return this.mapStack(data)
  }

  async unpublishStack(stackId: string): Promise<Stack> {
    const { data, error } = await this.supabase
      .from('stacks')
      .update({
        is_public: false,
        published_at: null,
      })
      .eq('id', stackId)
      .select()
      .single()

    if (error) throw error

    return this.mapStack(data)
  }

  async getPublicStack(slug: string): Promise<{
    stack: Stack
    cards: any[]
    elements: any[]
  }> {
    // Get stack
    const { data: stackData, error: stackError } = await this.supabase
      .from('stacks')
      .select('*')
      .eq('slug', slug)
      .eq('is_public', true)
      .single()

    if (stackError) throw stackError

    // Increment view count
    await this.supabase
      .from('stacks')
      .update({ view_count: (stackData.view_count || 0) + 1 })
      .eq('id', stackData.id)

    // Get cards
    const { data: cardsData, error: cardsError } = await this.supabase
      .from('cards')
      .select('*')
      .eq('stack_id', stackData.id)
      .order('order_index')

    if (cardsError) throw cardsError

    // Get all elements for all cards
    const cardIds = cardsData.map(c => c.id)
    const { data: elementsData, error: elementsError } = await this.supabase
      .from('elements')
      .select('*')
      .in('card_id', cardIds)
      .order('order_index')

    if (elementsError) throw elementsError

    return {
      stack: this.mapStack(stackData),
      cards: cardsData,
      elements: elementsData,
    }
  }

  async getFeaturedStacks(limit: number = 10): Promise<Stack[]> {
    const { data, error } = await this.supabase
      .from('stacks')
      .select('*')
      .eq('is_public', true)
      .eq('featured', true)
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) throw error

    return data.map(this.mapStack)
  }

  async searchPublicStacks(query: string, tags?: string[]): Promise<Stack[]> {
    let queryBuilder = this.supabase
      .from('stacks')
      .select('*')
      .eq('is_public', true)

    if (query) {
      queryBuilder = queryBuilder.or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    }

    if (tags && tags.length > 0) {
      queryBuilder = queryBuilder.contains('tags', tags)
    }

    const { data, error } = await queryBuilder
      .order('view_count', { ascending: false })
      .limit(50)

    if (error) throw error

    return data.map(this.mapStack)
  }

  private mapStack(data: any): Stack {
    return {
      id: data.id,
      ownerId: data.owner_id,
      name: data.name,
      description: data.description,
      isPublic: data.is_public,
      publishedAt: data.published_at,
      settings: data.settings,
      slug: data.slug,
      viewCount: data.view_count || 0,
      featured: data.featured || false,
      tags: data.tags || [],
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    }
  }
}
```

### 6.3 Public Stack Player

**Public Player Page**: `app/play/[slug]/page.tsx`

```typescript
'use client'

import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { PublishingService } from '@/lib/services/publishing'
import RuntimeCanvas from '@/components/runtime/RuntimeCanvas'
import { Card, Element, Stack } from '@/lib/types'
import { ArrowLeft, ArrowRight, Home, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function PlayStackPage() {
  const params = useParams()
  const slug = params.slug as string

  const [stack, setStack] = useState<Stack | null>(null)
  const [cards, setCards] = useState<Card[]>([])
  const [elements, setElements] = useState<Element[]>([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    loadStack()
  }, [slug])

  const loadStack = async () => {
    try {
      const publishingService = new PublishingService()
      const data = await publishingService.getPublicStack(slug)
      
      setStack(data.stack)
      setCards(data.cards.map(mapCard))
      setElements(data.elements.map(mapElement))
    } catch (error) {
      console.error('Failed to load stack:', error)
    } finally {
      setLoading(false)
    }
  }

  const currentCard = cards[currentCardIndex]
  const currentElements = elements.filter(e => e.cardId === currentCard?.id)

  const handleNavigate = (direction: 'next' | 'prev' | string) => {
    if (direction === 'next') {
      setCurrentCardIndex(Math.min(currentCardIndex + 1, cards.length - 1))
    } else if (direction === 'prev') {
      setCurrentCardIndex(Math.max(currentCardIndex - 1, 0))
    } else {
      // Navigate to specific card by ID
      const index = cards.findIndex(c => c.id === direction)
      if (index !== -1) {
        setCurrentCardIndex(index)
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading stack...</div>
        </div>
      </div>
    )
  }

  if (!stack || !currentCard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Stack not found</h1>
          <Link href="/explore">
            <Button>Browse Stacks</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-100 ${fullscreen ? 'p-0' : 'p-8'}`}>
      {!fullscreen && (
        <div className="max-w-7xl mx-auto mb-4">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/explore">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Gallery
                </Button>
              </Link>
              <h1 className="text-2xl font-bold mt-2">{stack.name}</h1>
              {stack.description && (
                <p className="text-gray-600 mt-1">{stack.description}</p>
              )}
            </div>
            <div className="text-sm text-gray-500">
              Card {currentCardIndex + 1} of {cards.length}
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-center">
        <div className="relative">
          <RuntimeCanvas
            card={currentCard}
            elements={currentElements}
            onNavigate={handleNavigate}
            onElementUpdate={(elementId, updates) => {
              setElements(elements.map(e =>
                e.id === elementId ? { ...e, ...updates } : e
              ))
            }}
          />

          {/* Navigation Controls */}
          {!fullscreen && (
            <div className="absolute -bottom-16 left-0 right-0 flex justify-center gap-2">
              <Button
                onClick={() => handleNavigate('prev')}
                disabled={currentCardIndex === 0}
                size="sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setCurrentCardIndex(0)}
                size="sm"
                variant="outline"
              >
                <Home className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => handleNavigate('next')}
                disabled={currentCardIndex === cards.length - 1}
                size="sm"
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
              <Button
                onClick={() => setFullscreen(!fullscreen)}
                size="sm"
                variant="outline"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Helper mapping functions
function mapCard(data: any): Card {
  return {
    id: data.id,
    stackId: data.stack_id,
    name: data.name,
    orderIndex: data.order_index,
    backgroundColor: data.background_color,
    backgroundImage: data.background_image,
    script: data.script,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}

function mapElement(data: any): Element {
  return {
    id: data.id,
    cardId: data.card_id,
    type: data.type,
    orderIndex: data.order_index,
    position: data.position,
    properties: data.properties,
    script: data.script,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  }
}
```

### 6.4 Stack Gallery

**Gallery Page**: `app/explore/page.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { PublishingService } from '@/lib/services/publishing'
import { Stack } from '@/lib/types'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Search, Eye, Star } from 'lucide-react'
import Link from 'next/link'

export default function ExplorePage() {
  const [stacks, setStacks] = useState<Stack[]>([])
  const [featured, setFeatured] = useState<Stack[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStacks()
  }, [])

  const loadStacks = async () => {
    try {
      const publishingService = new PublishingService()
      const [featuredStacks, allStacks] = await Promise.all([
        publishingService.getFeaturedStacks(5),
        publishingService.searchPublicStacks(''),
      ])
      
      setFeatured(featuredStacks)
      setStacks(allStacks)
    } catch (error) {
      console.error('Failed to load stacks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = async () => {
    try {
      setLoading(true)
      const publishingService = new PublishingService()
      const results = await publishingService.searchPublicStacks(searchQuery)
      setStacks(results)
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading && stacks.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading stacks...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">Explore Stacks</h1>
          
          {/* Search */}
          <div className="flex gap-2 max-w-2xl">
            <Input
              placeholder="Search stacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search className="w-4 h-4 mr-2" />
              Search
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Featured Section */}
        {featured.length > 0 && (
          <section className="mb-12">
            <div className="flex items-center gap-2 mb-4">
              <Star className="w-5 h-5 text-yellow-500" />
              <h2 className="text-2xl font-semibold">Featured Stacks</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((stack) => (
                <StackCard key={stack.id} stack={stack} featured />
              ))}
            </div>
          </section>
        )}

        {/* All Stacks */}
        <section>
          <h2 className="text-2xl font-semibold mb-4">All Stacks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stacks.map((stack) => (
              <StackCard key={stack.id} stack={stack} />
            ))}
          </div>

          {stacks.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No stacks found. Try a different search.
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

function StackCard({ stack, featured = false }: { stack: Stack; featured?: boolean }) {
  return (
    <Link href={`/play/${stack.slug}`}>
      <Card className={`p-6 border-2 border-black shadow-hypercard hover:shadow-hypercard-hover transition-all ${featured ? 'bg-yellow-50' : ''}`}>
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-lg font-semibold">{stack.name}</h3>
          {featured && <Star className="w-5 h-5 text-yellow-500" />}
        </div>
        
        {stack.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {stack.description}
          </p>
        )}

        <div className="flex items-center gap-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {stack.viewCount}
          </div>
          <div>
            {new Date(stack.publishedAt!).toLocaleDateString()}
          </div>
        </div>

        {stack.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {stack.tags.slice(0, 3).map((tag, i) => (
              <span
                key={i}
                className="text-xs bg-gray-200 px-2 py-1 rounded"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </Card>
    </Link>
  )
}
```

### 6.5 Publish Dialog

**Publish Dialog**: `components/editor/PublishDialog.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PublishingService } from '@/lib/services/publishing'
import { Stack } from '@/lib/types'
import { Globe, Copy, Check } from 'lucide-react'

interface PublishDialogProps {
  stack: Stack
  open: boolean
  onClose: () => void
  onPublished: (stack: Stack) => void
}

export default function PublishDialog({ 
  stack, 
  open, 
  onClose, 
  onPublished 
}: PublishDialogProps) {
  const [tags, setTags] = useState<string>(stack.tags.join(', '))
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const publishingService = new PublishingService()

  const publicUrl = stack.slug 
    ? `${window.location.origin}/play/${stack.slug}`
    : ''

  const handlePublish = async () => {
    setLoading(true)
    try {
      const tagArray = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)

      const published = await publishingService.publishStack(stack.id, tagArray)
      onPublished(published)
    } catch (error) {
      alert('Failed to publish stack')
    } finally {
      setLoading(false)
    }
  }

  const handleUnpublish = async () => {
    setLoading(true)
    try {
      const unpublished = await publishingService.unpublishStack(stack.id)
      onPublished(unpublished)
    } catch (error) {
      alert('Failed to unpublish stack')
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(publicUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {stack.isPublic ? 'Manage Published Stack' : 'Publish Stack'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {stack.isPublic ? (
            <>
              <div>
                <Label>Public URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input value={publicUrl} readOnly />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <div>
                <Label>Views</Label>
                <div className="text-2xl font-bold mt-1">
                  {stack.viewCount}
                </div>
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tutorial, game, education"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handlePublish}
                  disabled={loading}
                  className="flex-1"
                >
                  Update
                </Button>
                <Button
                  onClick={handleUnpublish}
                  disabled={loading}
                  variant="outline"
                  className="flex-1"
                >
                  Unpublish
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-gray-600">
                Publishing your stack will make it publicly accessible. Anyone with the link will be able to view and interact with your stack.
              </div>

              <div>
                <Label>Tags (comma-separated)</Label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="tutorial, game, education"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Help others discover your stack with relevant tags
                </div>
              </div>

              <Button
                onClick={handlePublish}
                disabled={loading}
                className="w-full"
              >
                <Globe className="w-4 h-4 mr-2" />
                Publish Stack
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

**Add to EditorToolbar.tsx**:

```typescript
import PublishDialog from './PublishDialog'

const [showPublishDialog, setShowPublishDialog] = useState(false)

// Add button
<Button
  onClick={() => setShowPublishDialog(true)}
  variant="outline"
  size="sm"
  className="border-2 border-black"
>
  <Globe className="w-4 h-4 mr-2" />
  {stack.isPublic ? 'Published' : 'Publish'}
</Button>

// Add dialog
<PublishDialog
  stack={stack}
  open={showPublishDialog}
  onClose={() => setShowPublishDialog(false)}
  onPublished={(updatedStack) => {
    // Update stack state
    setShowPublishDialog(false)
  }}
/>
```

### 6.6 Embed Code Generator

**Embed Component**: `components/publishing/EmbedCode.tsx`

```typescript
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Copy, Check } from 'lucide-react'

interface EmbedCodeProps {
  slug: string
}

export default function EmbedCode({ slug }: EmbedCodeProps) {
  const [width, setWidth] = useState('800')
  const [height, setHeight] = useState('600')
  const [copied, setCopied] = useState(false)

  const embedCode = `<iframe 
  src="${window.location.origin}/play/${slug}" 
  width="${width}" 
  height="${height}" 
  frameborder="0"
  allowfullscreen
></iframe>`

  const handleCopy = () => {
    navigator.clipboard.writeText(embedCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Width (px)</Label>
          <Input
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
          />
        </div>
        <div>
          <Label>Height (px)</Label>
          <Input
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
          />
        </div>
      </div>

      <div>
        <Label>Embed Code</Label>
        <div className="relative">
          <textarea
            value={embedCode}
            readOnly
            className="w-full p-3 border-2 rounded font-mono text-xs resize-none"
            rows={6}
          />
          <Button
            size="sm"
            variant="outline"
            className="absolute top-2 right-2"
            onClick={handleCopy}
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      <div className="text-xs text-gray-500">
        Copy this code and paste it into your website to embed this stack.
      </div>
    </div>
  )
}
```

## Deliverables Checklist

- [ ] Publishing service with slug generation
- [ ] Publish/unpublish functionality
- [ ] Public stack player page
- [ ] Stack gallery/explore page
- [ ] Search and filtering
- [ ] View count tracking
- [ ] Featured stacks section
- [ ] Publish dialog component
- [ ] Embed code generator
- [ ] Tag system for categorization

## Testing Checklist

- [ ] Stacks can be published and unpublished
- [ ] Unique slugs are generated correctly
- [ ] Public players can view published stacks
- [ ] Navigation works in player mode
- [ ] Scripts execute correctly in published stacks
- [ ] View counts increment properly
- [ ] Search finds relevant stacks
- [ ] Embed codes work on external sites
- [ ] Tags help with discovery
- [ ] Featured stacks display prominently

## Production Checklist

- [ ] Set up custom domain (optional)
- [ ] Configure Supabase RLS policies for production
- [ ] Set up analytics (view tracking)
- [ ] Add rate limiting for API routes
- [ ] Implement proper error boundaries
- [ ] Add loading states everywhere
- [ ] Optimize images and assets
- [ ] Add SEO meta tags for public pages
- [ ] Test mobile responsiveness
- [ ] Set up monitoring and logging

## Congratulations!

You've completed all phases of the HyperCard Renaissance project. The application now includes:

✅ User authentication
✅ Stack and card management
✅ Visual drag-and-drop editor
✅ Scripting engine with interactivity
✅ AI-powered assistance
✅ Publishing and sharing capabilities

Next steps for enhancement:
- Add collaborative editing
- Implement version history
- Create mobile app versions
- Add more element types
- Build community features
- Integrate with MCP servers