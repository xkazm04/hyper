'use client'

import { useState } from 'react'
import { Copy, Check, MessageSquare, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CharacterAsset } from '@/lib/types'
import { ReviewsList } from './ReviewsList'

interface AssetReviewsProps {
  asset: CharacterAsset
}

const assetTypeLabels: Record<string, string> = {
  character: 'Character',
  prompt_template: 'Prompt Template',
  avatar_set: 'Avatar Set',
  character_pack: 'Character Pack',
  story_template: 'Story Template',
}

const licenseLabels: Record<string, string> = {
  free: 'Free to use',
  attribution: 'Attribution required',
  'non-commercial': 'Non-commercial use only',
  commercial: 'Commercial license',
  exclusive: 'Exclusive license',
}

export function AssetReviews({ asset }: AssetReviewsProps) {
  const [copied, setCopied] = useState(false)

  const copyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'simple': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
      case 'moderate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'
      case 'complex': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
      default: return ''
    }
  }

  return (
    <Tabs defaultValue="details" className="mt-4">
      <TabsList className="w-full flex-wrap h-auto">
        <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
        {asset.characterData && (
          <TabsTrigger value="character" className="flex-1">Character</TabsTrigger>
        )}
        {asset.promptTemplate && (
          <TabsTrigger value="template" className="flex-1">Template</TabsTrigger>
        )}
        {asset.storyTemplateData && (
          <TabsTrigger value="story" className="flex-1">
            <MapPin className="w-3 h-3 mr-1" />
            Story
          </TabsTrigger>
        )}
        <TabsTrigger value="reviews" className="flex-1">
          <MessageSquare className="w-3 h-3 mr-1" />
          Reviews
        </TabsTrigger>
      </TabsList>

      <TabsContent value="details" className="space-y-3 mt-3">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-muted-foreground">Type</div>
          <div>{assetTypeLabels[asset.assetType]}</div>
          <div className="text-muted-foreground">Category</div>
          <div className="capitalize">{asset.category}</div>
          <div className="text-muted-foreground">License</div>
          <div>{licenseLabels[asset.licenseType]}</div>
          <div className="text-muted-foreground">Version</div>
          <div>{asset.version}</div>
          {asset.royaltyPercentage > 0 && (
            <>
              <div className="text-muted-foreground">Creator Royalty</div>
              <div>{asset.royaltyPercentage}%</div>
            </>
          )}
        </div>
        {asset.demoUrl && (
          <div className="pt-2">
            <a
              href={asset.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View Live Demo
            </a>
          </div>
        )}
      </TabsContent>

      {asset.characterData && (
        <TabsContent value="character" className="space-y-3 mt-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Character Name</div>
            <div className="text-sm">{asset.characterData.name}</div>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Appearance</div>
            <div className="text-sm text-muted-foreground">
              {asset.characterData.appearance}
            </div>
          </div>
          {asset.characterData.avatarUrl && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Avatar</div>
              <img
                src={asset.characterData.avatarUrl}
                alt="Avatar"
                className="w-16 h-16 rounded-full object-cover"
              />
            </div>
          )}
        </TabsContent>
      )}

      {asset.promptTemplate && (
        <TabsContent value="template" className="space-y-3 mt-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">Prompt Template</div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyPrompt(asset.promptTemplate!.template)}
                data-testid="copy-prompt-btn"
              >
                {copied ? (
                  <Check className="w-4 h-4 mr-1" />
                ) : (
                  <Copy className="w-4 h-4 mr-1" />
                )}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
              {asset.promptTemplate.template}
            </pre>
          </div>
          {asset.promptTemplate.variables.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Variables</div>
              <div className="flex flex-wrap gap-1">
                {asset.promptTemplate.variables.map((v) => (
                  <Badge key={v} variant="secondary" className="text-xs">
                    {`{${v}}`}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Style</div>
            <div>{asset.promptTemplate.style}</div>
            <div className="text-muted-foreground">Category</div>
            <div>{asset.promptTemplate.category}</div>
          </div>
        </TabsContent>
      )}

      {asset.storyTemplateData && (
        <TabsContent value="story" className="space-y-3 mt-3">
          <div className="space-y-2">
            <div className="text-sm font-medium">Story Title</div>
            <div className="text-sm">{asset.storyTemplateData.storyStack.title}</div>
          </div>
          {asset.storyTemplateData.storyStack.description && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Description</div>
              <div className="text-sm text-muted-foreground">
                {asset.storyTemplateData.storyStack.description}
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-sm pt-2">
            <div className="text-muted-foreground">Cards</div>
            <div>{asset.storyTemplateData.metadata.cardCount}</div>
            <div className="text-muted-foreground">Choices</div>
            <div>{asset.storyTemplateData.metadata.choiceCount}</div>
            <div className="text-muted-foreground">Est. Play Time</div>
            <div>{asset.storyTemplateData.metadata.estimatedPlayTime} min</div>
            <div className="text-muted-foreground">Complexity</div>
            <Badge className={getComplexityColor(asset.storyTemplateData.metadata.complexity)}>
              {asset.storyTemplateData.metadata.complexity}
            </Badge>
          </div>
          {asset.documentation && (
            <div className="space-y-2 pt-2">
              <div className="text-sm font-medium">Documentation</div>
              <div className="p-3 bg-muted rounded-md text-xs whitespace-pre-wrap max-h-40 overflow-y-auto">
                {asset.documentation}
              </div>
            </div>
          )}
        </TabsContent>
      )}

      <TabsContent value="reviews" className="mt-3">
        <ReviewsList asset={asset} />
      </TabsContent>
    </Tabs>
  )
}
