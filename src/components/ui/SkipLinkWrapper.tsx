'use client'

import dynamic from 'next/dynamic'

const SkipLink = dynamic(() => import('./SkipLink').then(mod => mod.SkipLink), { ssr: false })

interface SkipLinkWrapperProps {
  targetId?: string
  label?: string
}

export function SkipLinkWrapper({ targetId, label }: SkipLinkWrapperProps) {
  return <SkipLink targetId={targetId} label={label} />
}
