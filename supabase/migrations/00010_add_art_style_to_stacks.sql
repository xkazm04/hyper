-- Migration: Add art_style columns to story_stacks table
-- This stores the story-level art style settings that apply to all card image generations

-- Add art_style_id column (references predefined style ID, nullable for custom styles)
ALTER TABLE story_stacks ADD COLUMN IF NOT EXISTS art_style_id TEXT DEFAULT 'adventure_journal';

-- Add custom_art_style_prompt column (for custom user-defined styles)
ALTER TABLE story_stacks ADD COLUMN IF NOT EXISTS custom_art_style_prompt TEXT;

-- Add art_style_source column to track where the custom style came from
-- Values: 'preset' (using predefined art_style_id), 'custom' (user typed), 'extracted' (from image)
ALTER TABLE story_stacks ADD COLUMN IF NOT EXISTS art_style_source TEXT DEFAULT 'preset' 
  CHECK (art_style_source IN ('preset', 'custom', 'extracted'));

-- Add extracted_style_image_url for reference when style was extracted from an image
ALTER TABLE story_stacks ADD COLUMN IF NOT EXISTS extracted_style_image_url TEXT;

-- Comment for documentation
COMMENT ON COLUMN story_stacks.art_style_id IS 'Predefined art style ID from the artstyles.ts file. Default is adventure_journal.';
COMMENT ON COLUMN story_stacks.custom_art_style_prompt IS 'Custom art style prompt text when user provides their own or extracts from image.';
COMMENT ON COLUMN story_stacks.art_style_source IS 'Source of the art style: preset (using predefined ID), custom (user typed), or extracted (from uploaded image).';
COMMENT ON COLUMN story_stacks.extracted_style_image_url IS 'URL of the image that was used to extract the custom art style.';
