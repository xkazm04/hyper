import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Marketplace - HyperCard Renaissance',
  description: 'Discover and share characters, prompt templates, and avatar sets',
}

export default function MarketplaceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}
