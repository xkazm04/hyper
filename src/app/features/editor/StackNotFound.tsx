'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home } from 'lucide-react'
import { motion } from 'framer-motion'

interface StackNotFoundProps {
  stackId?: string
}

export default function StackNotFound({ stackId }: StackNotFoundProps) {
  const router = useRouter()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="text-center space-y-6 p-8 max-w-md"
      >
        <div className="flex justify-center">
          <div className="border-4 border-red-500 bg-red-50 p-6 shadow-[4px_4px_0px_0px_rgba(239,68,68,1)]">
            <AlertCircle className="w-16 h-16 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-4xl font-bold">Stack Not Found</h1>
          <p className="text-gray-600">
            {stackId
              ? `The stack with ID "${stackId}" does not exist or you don't have access to it.`
              : 'The stack ID is missing or invalid.'}
          </p>
        </div>

        <div className="pt-4">
          <Button
            onClick={() => router.push('/dashboard')}
            size="lg"
            className="border-4 border-black bg-black text-white hover:bg-gray-800 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all duration-150"
            data-testid="return-to-dashboard-btn"
          >
            <Home className="w-5 h-5 mr-2" />
            Return to Dashboard
          </Button>
        </div>

        <p className="text-xs text-gray-500 font-mono">
          Error: STACK_NOT_FOUND
        </p>
      </motion.div>
    </div>
  )
}
