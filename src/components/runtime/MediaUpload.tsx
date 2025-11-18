'use client'

import { useState, useRef } from 'react'
import { Upload, Image as ImageIcon, Video, X, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { StorageService, UploadMediaResult } from '@/lib/services/storage'

interface MediaUploadProps {
  stackId: string
  onUploadComplete: (result: UploadMediaResult) => void
}

export default function MediaUpload({ stackId, onUploadComplete }: MediaUploadProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadedFile, setUploadedFile] = useState<UploadMediaResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const storageService = new StorageService()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Reset state
    setError(null)
    setUploadedFile(null)
    setPreviewUrl(null)

    // Create preview
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)

    // Upload file
    setUploading(true)
    try {
      const result = await storageService.uploadMedia(file, stackId)
      setUploadedFile(result)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
      setPreviewUrl(null)
    } finally {
      setUploading(false)
    }
  }

  const handleCopyUrl = () => {
    if (uploadedFile) {
      navigator.clipboard.writeText(uploadedFile.url)
      onUploadComplete(uploadedFile)
      handleClose()
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setUploadedFile(null)
    setError(null)
    setPreviewUrl(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          variant="outline"
          className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all"
          data-testid="media-upload-btn"
        >
          <Upload className="w-5 h-5 mr-2" />
          Upload Media
        </Button>
      </DialogTrigger>
      <DialogContent data-testid="media-upload-modal">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Upload Media</DialogTitle>
          <DialogDescription>
            Upload images or videos to use in your interactive stack
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* File input (hidden) */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*"
            onChange={handleFileSelect}
            className="hidden"
            data-testid="media-file-input"
          />

          {/* Upload area */}
          {!previewUrl && !uploadedFile && (
            <div
              onClick={triggerFileInput}
              className="border-4 border-dashed border-black p-8 text-center cursor-pointer hover:bg-gray-50 transition-colors"
              data-testid="upload-drop-zone"
            >
              <div className="flex justify-center mb-4">
                <ImageIcon className="w-12 h-12 text-gray-400" />
              </div>
              <p className="text-lg font-semibold mb-2">Click to upload</p>
              <p className="text-sm text-gray-600">
                Supports: Images (max 50MB) and Videos (max 100MB)
              </p>
            </div>
          )}

          {/* Preview */}
          {previewUrl && !uploadedFile && (
            <div className="border-4 border-black p-4 relative">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-semibold">Preview</span>
                {uploading && (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                    <span className="text-sm">Uploading...</span>
                  </div>
                )}
              </div>
              <div className="bg-gray-100 flex items-center justify-center min-h-[200px]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-w-full max-h-[300px] object-contain"
                />
              </div>
            </div>
          )}

          {/* Success state */}
          {uploadedFile && (
            <div className="border-4 border-green-500 bg-green-50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Check className="w-6 h-6 text-green-600" />
                <span className="font-bold text-green-800">Upload Successful!</span>
              </div>
              <div className="bg-white border-2 border-black p-3 font-mono text-sm break-all">
                {uploadedFile.url}
              </div>
              <div className="mt-3 flex gap-2">
                <Button
                  onClick={handleCopyUrl}
                  className="flex-1 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-green-500 hover:bg-green-600 text-white"
                  data-testid="copy-url-btn"
                >
                  Copy URL & Close
                </Button>
                <Button
                  onClick={triggerFileInput}
                  variant="outline"
                  className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                  data-testid="upload-another-btn"
                >
                  Upload Another
                </Button>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="border-4 border-red-500 bg-red-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <X className="w-6 h-6 text-red-600" />
                <span className="font-bold text-red-800">Upload Failed</span>
              </div>
              <p className="text-sm text-red-700">{error}</p>
              <Button
                onClick={triggerFileInput}
                variant="outline"
                className="mt-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
                data-testid="retry-upload-btn"
              >
                Try Again
              </Button>
            </div>
          )}

          {/* Help text */}
          <div className="bg-gray-50 border-2 border-gray-300 p-3 text-sm">
            <p className="font-semibold mb-1">How to use:</p>
            <ol className="list-decimal list-inside space-y-1 text-gray-700">
              <li>Upload your image or video file</li>
              <li>Copy the generated URL</li>
              <li>Use the URL in your stack scripts or element properties</li>
              <li>Example: <code className="bg-white px-1 border border-gray-300">element.properties.src = "url"</code></li>
            </ol>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
