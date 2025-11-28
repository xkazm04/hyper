'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { LicenseType } from '@/lib/types'

const licenseTypes: { value: LicenseType; label: string; description: string }[] = [
  { value: 'free', label: 'Free', description: 'Anyone can use freely' },
  { value: 'attribution', label: 'Attribution', description: 'Credit required' },
  { value: 'non-commercial', label: 'Non-Commercial', description: 'No commercial use' },
  { value: 'commercial', label: 'Commercial', description: 'Paid license for commercial use' },
]

interface AssetPricingProps {
  licenseType: LicenseType
  setLicenseType: (value: LicenseType) => void
  isFree: boolean
  setIsFree: (value: boolean) => void
  price: string
  setPrice: (value: string) => void
  royaltyPercentage: string
  setRoyaltyPercentage: (value: string) => void
}

export function AssetPricing({
  licenseType,
  setLicenseType,
  isFree,
  setIsFree,
  price,
  setPrice,
  royaltyPercentage,
  setRoyaltyPercentage,
}: AssetPricingProps) {
  return (
    <div className="space-y-4 pt-4 border-t">
      <h3 className="font-medium">Licensing & Pricing</h3>
      <div className="space-y-2">
        <Label>License Type</Label>
        <Select
          value={licenseType}
          onValueChange={(v) => setLicenseType(v as LicenseType)}
        >
          <SelectTrigger data-testid="license-type-input">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {licenseTypes.map((license) => (
              <SelectItem key={license.value} value={license.value}>
                <div>
                  <div>{license.label}</div>
                  <div className="text-xs text-muted-foreground">{license.description}</div>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-4">
        <Switch
          checked={isFree}
          onCheckedChange={setIsFree}
          id="isFree"
          data-testid="is-free-switch"
        />
        <Label htmlFor="isFree">Free asset</Label>
      </div>

      {!isFree && (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price">Price ($)</Label>
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="9.99"
              data-testid="price-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="royalty">Royalty (%)</Label>
            <Input
              id="royalty"
              type="number"
              min="0"
              max="100"
              value={royaltyPercentage}
              onChange={(e) => setRoyaltyPercentage(e.target.value)}
              placeholder="10"
              data-testid="royalty-input"
            />
          </div>
        </div>
      )}
    </div>
  )
}
