'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Loader2,
  UserPlus,
  User,
  ChevronRight,
  ArrowLeft,
  X,
  Sparkles,
  Sliders,
  CheckCircle2,
  Brain,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useEditor } from '@/contexts/EditorContext'
import type { Character } from '@/lib/types'
import { ImageCompareModal } from './ImageCompareModal'

interface ImageInsertPanelProps {
  imageUrl: string
  onImageUpdate: (newImageUrl: string) => void
  disabled?: boolean
}

type ModalStep = 'select-character' | 'select-image' | 'configure-insert'

/**
 * ImageInsertPanel - Insert trained character models into scenes using Bria AI
 * Features structure strength control for scene preservation
 */
export function ImageInsertPanel({
  imageUrl,
  onImageUpdate,
  disabled = false,
}: ImageInsertPanelProps) {
  const { characters, storyStack } = useEditor()

  const [isBriaAvailable, setIsBriaAvailable] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalStep, setModalStep] = useState<ModalStep>('select-character')
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)

  // Insert configuration
  const [structureStrength, setStructureStrength] = useState(0.6)
  const [additionalPrompt, setAdditionalPrompt] = useState('')
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null)

  // Compare modal state
  const [compareModal, setCompareModal] = useState<{
    isOpen: boolean
    processedUrl: string
  }>({
    isOpen: false,
    processedUrl: '',
  })

  // Get characters with trained Bria models
  const trainedCharacters = characters.filter(
    (char) => char.briaModelStatus === 'completed' && char.briaModelId
  )

  // Check if Bria API is available
  useEffect(() => {
    const checkAvailability = async () => {
      try {
        const response = await fetch('/api/ai/bria/status')
        const data = await response.json()
        setIsBriaAvailable(data.available)
      } catch {
        setIsBriaAvailable(false)
      } finally {
        setIsChecking(false)
      }
    }

    checkAvailability()
  }, [])

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true)
    setModalStep('select-character')
    setSelectedCharacter(null)
    setSelectedImageUrl(null)
    setStructureStrength(0.6)
    setAdditionalPrompt('')
    setError(null)
  }, [])

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false)
    setModalStep('select-character')
    setSelectedCharacter(null)
    setSelectedImageUrl(null)
    setError(null)
  }, [])

  const handleSelectCharacter = useCallback((character: Character) => {
    setSelectedCharacter(character)
    // If character has images, go to image selection step; otherwise go directly to configure
    if (character.imageUrls && character.imageUrls.length > 0) {
      setModalStep('select-image')
    } else {
      setModalStep('configure-insert')
    }
  }, [])

  const handleSelectImage = useCallback((imageUrl: string) => {
    setSelectedImageUrl(imageUrl)
    setModalStep('configure-insert')
  }, [])

  const handleBack = useCallback(() => {
    if (modalStep === 'configure-insert' && selectedImageUrl) {
      // Go back to image selection
      setModalStep('select-image')
      setSelectedImageUrl(null)
    } else if (modalStep === 'select-image') {
      // Go back to character selection
      setModalStep('select-character')
      setSelectedCharacter(null)
      setSelectedImageUrl(null)
    } else {
      // Default back to character selection
      setModalStep('select-character')
      setSelectedCharacter(null)
      setSelectedImageUrl(null)
    }
    setError(null)
  }, [modalStep, selectedImageUrl])

  const handleInsert = useCallback(async () => {
    if (!selectedCharacter || !selectedCharacter.briaModelId || !storyStack) return

    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/bria/reimagine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          characterId: selectedCharacter.id,
          storyStackId: storyStack.id,
          sceneImageUrl: imageUrl,
          characterImageUrl: selectedImageUrl, // The character reference image selected by user
          prompt: additionalPrompt || 'in the scene, natural pose',
          structureStrength,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to insert character')
      }

      const data = await response.json()

      // Close insert modal and open compare modal
      setIsModalOpen(false)
      setCompareModal({
        isOpen: true,
        processedUrl: data.imageUrl,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to insert character')
    } finally {
      setIsProcessing(false)
    }
  }, [imageUrl, selectedCharacter, storyStack, structureStrength, additionalPrompt, selectedImageUrl])

  const handleKeepOriginal = useCallback(() => {
    setCompareModal({ isOpen: false, processedUrl: '' })
  }, [])

  const handleUseProcessed = useCallback(() => {
    onImageUpdate(compareModal.processedUrl)
    setCompareModal({ isOpen: false, processedUrl: '' })
  }, [compareModal.processedUrl, onImageUpdate])

  const handleCloseCompare = useCallback(() => {
    setCompareModal({ isOpen: false, processedUrl: '' })
  }, [])

  // Get strength level description
  const getStrengthDescription = (value: number) => {
    if (value <= 0.3) return 'Loose - Character dominates'
    if (value <= 0.5) return 'Balanced - Natural blend'
    if (value <= 0.7) return 'Moderate - Scene preserved'
    return 'Strict - Maximum scene fidelity'
  }

  // Don't render if checking, not available, or no trained characters
  if (isChecking || !isBriaAvailable || trainedCharacters.length === 0) {
    return null
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={handleOpenModal}
        disabled={disabled || isProcessing}
        title="Insert a trained character into the scene"
        className={cn(
          'h-8 text-[10px] px-2',
          'border-purple-500/50 text-purple-600 dark:text-purple-400',
          'hover:bg-purple-500/10 hover:border-purple-500'
        )}
      >
        {isProcessing ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <>
            <Brain className="w-3 h-3 mr-1" />
            AI Insert
          </>
        )}
      </Button>

      {/* Character Selection Modal */}
      {isModalOpen && (
        <>
          {/* Backdrop - fully opaque */}
          <div
            className="fixed inset-0 z-50"
            style={{ backgroundColor: 'hsl(var(--background))' }}
            onClick={handleCloseModal}
          />
          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <div
              className="pointer-events-auto w-full max-w-lg max-h-[85vh] flex flex-col rounded-xl border-2 border-border shadow-[6px_6px_0px_0px_hsl(var(--border))]"
              style={{ backgroundColor: 'hsl(var(--background))' }}
            >
              {/* Header */}
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-3 border-b-2 border-border rounded-t-xl',
                  'bg-gradient-to-r from-purple-500/10 to-blue-500/10'
                )}
              >
                <div className="flex items-center gap-2">
                  {(modalStep === 'configure-insert' || modalStep === 'select-image') && (
                    <button
                      onClick={handleBack}
                      className="p-1 rounded-lg transition-colors text-foreground hover:bg-background/50"
                      disabled={isProcessing}
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-sm text-foreground">
                      {modalStep === 'select-character'
                        ? 'Insert Character'
                        : modalStep === 'select-image'
                        ? `Select ${selectedCharacter?.name} Image`
                        : `Configure Insertion`}
                    </h3>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-1 rounded-lg transition-colors text-foreground hover:bg-background/50"
                  disabled={isProcessing}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div
                className="flex-1 overflow-y-auto p-4"
                style={{ backgroundColor: 'hsl(var(--background))' }}
              >
                {modalStep === 'select-character' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">
                      Select a character with a trained AI model to insert into this scene.
                    </p>

                    {trainedCharacters.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No Trained Characters</p>
                        <p className="text-xs mt-1">
                          Train a character model first to use AI insertion.
                        </p>
                      </div>
                    ) : (
                      trainedCharacters.map((character) => (
                        <button
                          key={character.id}
                          onClick={() => handleSelectCharacter(character)}
                          className={cn(
                            'w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all',
                            'hover:border-purple-500 hover:shadow-md',
                            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                            'border-border bg-card'
                          )}
                        >
                          {/* Character Avatar */}
                          <div className="relative">
                            <div className="w-14 h-14 rounded-xl overflow-hidden border-2 border-border shrink-0 bg-muted">
                              {character.avatarUrl ? (
                                <img
                                  src={character.avatarUrl}
                                  alt={character.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : character.imageUrls[0] ? (
                                <img
                                  src={character.imageUrls[0]}
                                  alt={character.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <User className="w-6 h-6 text-muted-foreground/50" />
                                </div>
                              )}
                            </div>
                            {/* Trained badge */}
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center border-2 border-background">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </div>
                          </div>

                          {/* Character Info */}
                          <div className="flex-1 text-left">
                            <div className="font-medium text-sm text-foreground">
                              {character.name || 'Unnamed Character'}
                            </div>
                            <div className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1 mt-0.5">
                              <Sparkles className="w-3 h-3" />
                              AI Model Ready
                            </div>
                          </div>

                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </button>
                      ))
                    )}
                  </div>
                ) : modalStep === 'select-image' ? (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground mb-4">
                      Select a reference image for {selectedCharacter?.name}. This image will guide how the character appears in the scene.
                    </p>

                    {/* Image Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {selectedCharacter?.imageUrls.map((imgUrl, index) => (
                        <button
                          key={index}
                          onClick={() => handleSelectImage(imgUrl)}
                          className={cn(
                            'relative aspect-square rounded-lg overflow-hidden border-2 transition-all',
                            'hover:border-purple-500 hover:shadow-md hover:scale-[1.02]',
                            'focus:outline-none focus:ring-2 focus:ring-purple-500/50',
                            'border-border'
                          )}
                        >
                          <img
                            src={imgUrl}
                            alt={`${selectedCharacter.name} pose ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                          {/* Hover overlay */}
                          <div className="absolute inset-0 bg-purple-500/0 hover:bg-purple-500/10 transition-colors flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 bg-white/90 dark:bg-black/90 px-2 py-1 rounded text-[10px] font-medium">
                              Select
                            </div>
                          </div>
                          {/* Index badge */}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                            {index + 1}
                          </div>
                        </button>
                      ))}
                    </div>

                    {(!selectedCharacter?.imageUrls || selectedCharacter.imageUrls.length === 0) && (
                      <div className="text-center py-8 text-muted-foreground">
                        <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p className="text-sm font-medium">No Images Available</p>
                        <p className="text-xs mt-1">
                          Add images to this character first.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-5">
                    {/* Scene + Character Preview */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-muted-foreground">
                        Scene + Character Reference
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        {/* Scene */}
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-border bg-muted">
                          <img
                            src={imageUrl}
                            alt="Scene"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/60 text-[10px] text-white font-medium">
                            Scene
                          </div>
                        </div>
                        {/* Selected Character Image */}
                        <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-purple-500 bg-muted">
                          {selectedImageUrl ? (
                            <img
                              src={selectedImageUrl}
                              alt={`${selectedCharacter?.name} reference`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-8 h-8 text-muted-foreground/50" />
                            </div>
                          )}
                          <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-purple-600 text-[10px] text-white font-medium">
                            {selectedCharacter?.name}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Structure Strength Slider */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5" />
                          Scene Preservation
                        </label>
                        <span className="text-xs text-muted-foreground font-mono">
                          {Math.round(structureStrength * 100)}%
                        </span>
                      </div>

                      {/* Custom Slider */}
                      <div className="relative pt-1">
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={structureStrength}
                          onChange={(e) => setStructureStrength(parseFloat(e.target.value))}
                          disabled={isProcessing}
                          className={cn(
                            'w-full h-2 rounded-full appearance-none cursor-pointer',
                            'bg-gradient-to-r from-purple-500 to-blue-500',
                            '[&::-webkit-slider-thumb]:appearance-none',
                            '[&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5',
                            '[&::-webkit-slider-thumb]:rounded-full',
                            '[&::-webkit-slider-thumb]:bg-white',
                            '[&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-purple-500',
                            '[&::-webkit-slider-thumb]:shadow-lg',
                            '[&::-webkit-slider-thumb]:cursor-pointer',
                            '[&::-webkit-slider-thumb]:transition-transform',
                            '[&::-webkit-slider-thumb]:hover:scale-110',
                            'disabled:opacity-50 disabled:cursor-not-allowed'
                          )}
                        />
                        {/* Slider labels */}
                        <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
                          <span>Character Focus</span>
                          <span>Scene Focus</span>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground bg-muted/50 px-3 py-2 rounded-lg">
                        {getStrengthDescription(structureStrength)}
                      </p>
                    </div>

                    {/* Additional Prompt */}
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-foreground">
                        Scene Description (Optional)
                      </label>
                      <textarea
                        value={additionalPrompt}
                        onChange={(e) => setAdditionalPrompt(e.target.value)}
                        disabled={isProcessing}
                        placeholder="e.g., standing near the window, looking curious, dramatic lighting"
                        className={cn(
                          'w-full px-3 py-2 text-sm rounded-lg border-2 border-border',
                          'bg-background focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
                          'placeholder:text-muted-foreground/50 resize-none',
                          'disabled:opacity-50 disabled:cursor-not-allowed'
                        )}
                        rows={2}
                      />
                    </div>

                    {/* Error Display */}
                    {error && (
                      <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="text-xs text-destructive">{error}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              {modalStep === 'configure-insert' && (
                <div
                  className="px-4 py-3 border-t-2 border-border rounded-b-xl bg-muted/30"
                >
                  <Button
                    onClick={handleInsert}
                    disabled={isProcessing}
                    className={cn(
                      'w-full border-2 border-purple-500/50',
                      'bg-gradient-to-r from-purple-600 to-blue-600',
                      'hover:from-purple-700 hover:to-blue-700',
                      'text-white font-medium',
                      'shadow-[3px_3px_0px_0px_hsl(var(--border))]',
                      'hover:shadow-[4px_4px_0px_0px_hsl(var(--border))]',
                      'hover:-translate-x-px hover:-translate-y-px',
                      'transition-all duration-200'
                    )}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Scene...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 mr-2" />
                        Insert {selectedCharacter?.name}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Compare Modal */}
      <ImageCompareModal
        isOpen={compareModal.isOpen}
        originalUrl={imageUrl}
        processedUrl={compareModal.processedUrl}
        actionLabel="Character Inserted"
        onKeepOriginal={handleKeepOriginal}
        onUseProcessed={handleUseProcessed}
        onClose={handleCloseCompare}
      />
    </>
  )
}
