'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  AssetType,
  AssetCategory,
  LicenseType,
  CreateCharacterAssetInput,
  CharacterAssetData,
  PromptTemplateData,
  StoryTemplateData,
} from '@/lib/types'
import { useMarketplace } from '../lib/useMarketplace'
import { AssetMetadataForm } from './sub_CreateAssetForm/AssetMetadataForm'
import { AssetFileUpload } from './sub_CreateAssetForm/AssetFileUpload'
import { AssetPreview } from './sub_CreateAssetForm/AssetPreview'
import { AssetPricing } from './sub_CreateAssetForm/AssetPricing'
import { StoryTemplateUpload } from './sub_CreateAssetForm/StoryTemplateUpload'

interface CreateAssetFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function CreateAssetForm({ onSuccess, onCancel }: CreateAssetFormProps) {
  const { createAsset, loading, error } = useMarketplace()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [assetType, setAssetType] = useState<AssetType>('character')
  const [category, setCategory] = useState<AssetCategory>('fantasy')
  const [licenseType, setLicenseType] = useState<LicenseType>('free')
  const [isFree, setIsFree] = useState(true)
  const [price, setPrice] = useState('')
  const [royaltyPercentage, setRoyaltyPercentage] = useState('')
  const [thumbnailUrl, setThumbnailUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  // Character-specific fields
  const [characterName, setCharacterName] = useState('')
  const [characterAppearance, setCharacterAppearance] = useState('')
  const [characterImageUrls, setCharacterImageUrls] = useState<string[]>([''])
  const [characterAvatarUrl, setCharacterAvatarUrl] = useState('')

  // Prompt template fields
  const [promptTemplate, setPromptTemplate] = useState('')
  const [promptVariables] = useState<string[]>([])
  const [promptStyle, setPromptStyle] = useState('')

  // Story template fields
  const [storyTemplateData, setStoryTemplateData] = useState<StoryTemplateData | null>(null)
  const [demoUrl, setDemoUrl] = useState('')
  const [documentation, setDocumentation] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const input: CreateCharacterAssetInput = {
      name,
      description,
      assetType,
      category,
      licenseType,
      isFree,
      price: isFree ? 0 : parseFloat(price) || 0,
      royaltyPercentage: parseFloat(royaltyPercentage) || 0,
      thumbnailUrl: thumbnailUrl || undefined,
      tags,
    }

    // Add character data if applicable
    if (assetType === 'character' || assetType === 'avatar_set' || assetType === 'character_pack') {
      const characterData: CharacterAssetData = {
        name: characterName,
        appearance: characterAppearance,
        imageUrls: characterImageUrls.filter(Boolean),
        imagePrompts: [],
        avatarUrl: characterAvatarUrl || null,
        avatarPrompt: null,
      }
      input.characterData = characterData
    }

    // Add prompt template if applicable
    if (assetType === 'prompt_template' || assetType === 'character_pack') {
      const template: PromptTemplateData = {
        template: promptTemplate,
        variables: promptVariables,
        category: category,
        style: promptStyle,
      }
      input.promptTemplate = template
    }

    // Add story template if applicable
    if (assetType === 'story_template' && storyTemplateData) {
      input.storyTemplateData = storyTemplateData
      input.demoUrl = demoUrl || undefined
      input.documentation = documentation || undefined
    }

    const result = await createAsset(input)
    if (result && onSuccess) {
      onSuccess()
    }
  }

  const showCharacterFields = assetType === 'character' || assetType === 'avatar_set' || assetType === 'character_pack'
  const showPromptFields = assetType === 'prompt_template' || assetType === 'character_pack'
  const showStoryTemplateFields = assetType === 'story_template'

  return (
    <Card className="w-full max-w-2xl" data-testid="create-asset-form">
      <form onSubmit={handleSubmit}>
        <CardHeader>
          <CardTitle>Create New Asset</CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 bg-destructive/10 text-destructive rounded-md text-sm">
              {error}
            </div>
          )}

          <AssetMetadataForm
            name={name}
            setName={setName}
            description={description}
            setDescription={setDescription}
            assetType={assetType}
            setAssetType={setAssetType}
            category={category}
            setCategory={setCategory}
            thumbnailUrl={thumbnailUrl}
            setThumbnailUrl={setThumbnailUrl}
            tags={tags}
            setTags={setTags}
            tagInput={tagInput}
            setTagInput={setTagInput}
          />

          {showCharacterFields && (
            <AssetFileUpload
              characterName={characterName}
              setCharacterName={setCharacterName}
              characterAppearance={characterAppearance}
              setCharacterAppearance={setCharacterAppearance}
              characterImageUrls={characterImageUrls}
              setCharacterImageUrls={setCharacterImageUrls}
              characterAvatarUrl={characterAvatarUrl}
              setCharacterAvatarUrl={setCharacterAvatarUrl}
            />
          )}

          {showPromptFields && (
            <AssetPreview
              promptTemplate={promptTemplate}
              setPromptTemplate={setPromptTemplate}
              promptStyle={promptStyle}
              setPromptStyle={setPromptStyle}
            />
          )}

          {showStoryTemplateFields && (
            <StoryTemplateUpload
              storyTemplateData={storyTemplateData}
              setStoryTemplateData={setStoryTemplateData}
              demoUrl={demoUrl}
              setDemoUrl={setDemoUrl}
              documentation={documentation}
              setDocumentation={setDocumentation}
            />
          )}

          <AssetPricing
            licenseType={licenseType}
            setLicenseType={setLicenseType}
            isFree={isFree}
            setIsFree={setIsFree}
            price={price}
            setPrice={setPrice}
            royaltyPercentage={royaltyPercentage}
            setRoyaltyPercentage={setRoyaltyPercentage}
          />
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} data-testid="cancel-btn">
              Cancel
            </Button>
          )}
          <Button 
            type="submit" 
            disabled={loading} 
            data-testid="create-asset-btn"
            className="halloween-pumpkin-glow"
          >
            {loading ? 'Creating...' : 'Create Asset'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
