-- ============================================================================
-- Add Script Field to Story Cards
-- ============================================================================
-- This migration adds a script field to story_cards to support custom
-- JavaScript code that can be executed during story playback.
-- ============================================================================

-- Add script column to story_cards table
ALTER TABLE story_cards
ADD COLUMN script TEXT DEFAULT '';

-- Add comment for documentation
COMMENT ON COLUMN story_cards.script IS 'Custom JavaScript code for card interactivity';

-- ============================================================================
-- Migration Complete
-- ============================================================================
