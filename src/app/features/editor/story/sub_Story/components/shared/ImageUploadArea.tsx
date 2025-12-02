'use client'

import { useRef, useState } from 'react'
import { cn } from '@/lib/utils'
import { Upload, Loader2, X, Image as ImageIcon } from 'lucide-react'

interface ImageUploadAreaProps {
  onFileSelect: (file: File) => Promise<void>
  isLoading?: boolean
  disabled?: boolean
  error?: string | null
  uploadedImageUrl?: string | null
  onClear?: () => void
  className?: string
  uploadLabel?: string
  uploadHint?: string
  previewLabel?: string
}

export function ImageUploadArea({
  onFileSelect,
  isLoading = false,
  disabled = false,
  error = null,
  uploadedImageUrl = null,
  onClear,
  className,
  uploadLabel = 'Upload an image',
  uploadHint = 'Drop image here or click to browse',
  previewLabel = 'Style Reference'
}: ImageUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await onFileSelect(file)
  }

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files?.[0]
    if (file) {
      await onFileSelect(file)
    }
  }

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    setIsDragging(false)
  }

  const handleClear = () => {
    onClear?.()
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (uploadedImageUrl) {
    return (
      <div className={cn('relative rounded-lg border-2 border-border overflow-hidden', className)}>
        <img
          src={uploadedImageUrl}
          alt="Uploaded style reference"
          className="w-full h-32 object-cover"
        />
        {onClear && (
          <button
            onClick={handleClear}
            className="absolute top-2 right-2 p-1 rounded-full bg-background/80 hover:bg-background text-foreground"
            disabled={disabled}
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-background/80 text-xs font-medium">
          <ImageIcon className="w-3 h-3 inline mr-1" />
          {previewLabel}
        </div>
      </div>
    )
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={cn(
        'border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer',
        'hover:border-primary/50 hover:bg-primary/5',
        isDragging && 'border-primary bg-primary/10',
        disabled && 'opacity-50 cursor-not-allowed',
        error && 'border-destructive',
        className
      )}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      <div className="flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
          {isLoading ? (
            <Loader2 className="w-6 h-6 text-muted-foreground animate-spin" />
          ) : (
            <Upload className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div>
          <p className="text-sm font-medium">
            {isLoading ? 'Processing...' : uploadLabel}
          </p>
          <p className="text-xs text-muted-foreground">
            {uploadHint}
          </p>
        </div>
      </div>
    </div>
  )
}
