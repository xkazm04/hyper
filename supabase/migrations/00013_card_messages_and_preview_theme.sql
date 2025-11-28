-- ============================================================================
-- Card Messages & Preview Theme Migration
-- ============================================================================
-- This migration adds:
-- 1. Message field to story_cards for character/narrator dialogue
-- 2. Speaker field to story_cards for attributing the message
-- 3. Preview theme JSONB to story_stacks for consistent visual styling
-- ============================================================================

-- ============================================================================
-- PART 1: Add Message Fields to Story Cards
-- ============================================================================

-- Add message field for character/narrator dialogue
ALTER TABLE story_cards
ADD COLUMN IF NOT EXISTS message TEXT;

-- Add speaker field to attribute the message (character name, "narrator", etc.)
ALTER TABLE story_cards
ADD COLUMN IF NOT EXISTS speaker TEXT;

-- Add comments for documentation
COMMENT ON COLUMN story_cards.message IS 'Optional dialogue or message displayed on the card';
COMMENT ON COLUMN story_cards.speaker IS 'Who is speaking the message (character name, narrator, etc.)';

-- ============================================================================
-- PART 2: Add Preview Theme to Story Stacks
-- ============================================================================

-- Preview theme stores extracted/derived styling from art style for consistent UI
-- This allows message bubbles, choice buttons, typography to match the art style
ALTER TABLE story_stacks
ADD COLUMN IF NOT EXISTS preview_theme JSONB DEFAULT '{
  "fontFamily": "serif",
  "titleFont": "serif",
  "borderRadius": "md",
  "borderStyle": "solid",
  "borderWidth": 2,
  "messageBackground": "rgba(0,0,0,0.7)",
  "messageTextColor": "#ffffff",
  "messageBorderColor": "#ffffff",
  "choiceBackground": "#1a1a2e",
  "choiceTextColor": "#ffffff",
  "choiceBorderColor": "#4a4a6a",
  "choiceHoverBackground": "#2a2a4e",
  "accentColor": "#8b5cf6",
  "shadowStyle": "soft",
  "overlayOpacity": 0.6
}'::jsonb;

COMMENT ON COLUMN story_stacks.preview_theme IS 'Visual theme settings extracted from art style for consistent card preview styling';

-- ============================================================================
-- PART 3: Create Index for Performance
-- ============================================================================

-- Index for faster filtering of cards with messages
CREATE INDEX IF NOT EXISTS idx_story_cards_has_message 
ON story_cards(story_stack_id) 
WHERE message IS NOT NULL AND message != '';

-- ============================================================================
-- Migration Complete
-- ============================================================================
