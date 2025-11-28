'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CreateAssetForm } from '@/app/features/marketplace/components'

export default function CreateAssetPage() {
  const router = useRouter()

  const handleSuccess = () => {
    router.push('/marketplace/my-assets')
  }

  const handleCancel = () => {
    router.back()
  }

  return (
    <div className="container mx-auto py-8 px-4" data-testid="create-asset-page">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          data-testid="back-btn"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create New Asset</h1>
          <p className="text-muted-foreground">
            Share your characters, prompt templates, and more with the community
          </p>
        </div>
      </div>

      <div className="flex justify-center">
        <CreateAssetForm onSuccess={handleSuccess} onCancel={handleCancel} />
      </div>
    </div>
  )
}
