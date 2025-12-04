-- ============================================================================
-- Card Audio Narration Migration
-- ============================================================================
-- Adds audio narration support to story cards using ElevenLabs TTS
-- ============================================================================

-- Add audio_url column to story_cards table
ALTER TABLE story_cards
ADD COLUMN IF NOT EXISTS audio_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN story_cards.audio_url IS 'URL to ElevenLabs-generated audio narration for the card content';

-- Create index for cards with audio (useful for filtering)
CREATE INDEX IF NOT EXISTS idx_story_cards_has_audio
ON story_cards(story_stack_id)
WHERE audio_url IS NOT NULL;
