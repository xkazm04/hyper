import { NextResponse } from 'next/server'
import { LeonardoService, MODEL_IDS, PRESET_IDS, LeonardoModel, LeonardoPreset } from '@/lib/services/leonardo'

/**
 * GET /api/ai/leonardo/status
 * Check if Leonardo API is available and get supported models/presets
 */
export async function GET() {
  const available = LeonardoService.isAvailable()

  // Build models list
  const models = Object.entries(LeonardoModel).map(([key, value]) => ({
    id: value,
    modelId: MODEL_IDS[value as LeonardoModel],
    name: key.replace(/_/g, ' '),
    isV2: value === LeonardoModel.FLUX_2,
  }))

  // Build presets list
  const presets = Object.entries(LeonardoPreset).map(([key, value]) => ({
    id: value,
    presetId: PRESET_IDS[value as LeonardoPreset],
    name: key.replace(/_/g, ' '),
  }))

  return NextResponse.json({
    available,
    service: 'leonardo',
    models,
    presets,
    limits: {
      maxImages: 8,
      maxWidth: 1536,
      maxHeight: 1536,
      minWidth: 32,
      minHeight: 32,
    },
  })
}
