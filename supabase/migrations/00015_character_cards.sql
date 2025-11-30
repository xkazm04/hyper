-- Migration: Character Cards - Reusable Card Templates from Characters
-- Date: 2025-01-29
-- Description: Creates character_cards table that references characters as reusable card templates

-- Create character_cards table
CREATE TABLE character_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_stack_id UUID NOT NULL REFERENCES story_stacks(id) ON DELETE CASCADE,
  character_id UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
  title TEXT,  -- Optional override (uses character name if null)
  content TEXT,  -- Optional override (uses character appearance if null)
  image_index INTEGER NOT NULL DEFAULT 0,  -- Which character image to display (0-3)
  show_avatar BOOLEAN NOT NULL DEFAULT false,  -- Whether to show avatar instead of full image
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_character_cards_story_stack_id ON character_cards(story_stack_id);
CREATE INDEX idx_character_cards_character_id ON character_cards(character_id);
CREATE INDEX idx_character_cards_order_index ON character_cards(order_index);

-- Constraint to ensure image_index is within valid range
ALTER TABLE character_cards
ADD CONSTRAINT check_valid_image_index CHECK (image_index >= 0 AND image_index <= 3);

-- Enable RLS
ALTER TABLE character_cards ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read character cards from their own story stacks
CREATE POLICY "Users can view character cards from their own stacks"
  ON character_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = character_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can read character cards from published story stacks
CREATE POLICY "Users can view character cards from published stacks"
  ON character_cards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = character_cards.story_stack_id
      AND story_stacks.is_published = true
    )
  );

-- Users can insert character cards into their own story stacks
CREATE POLICY "Users can create character cards in their own stacks"
  ON character_cards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = character_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can update character cards in their own story stacks
CREATE POLICY "Users can update character cards in their own stacks"
  ON character_cards FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = character_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Users can delete character cards from their own story stacks
CREATE POLICY "Users can delete character cards from their own stacks"
  ON character_cards FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = character_cards.story_stack_id
      AND story_stacks.owner_id = auth.uid()
    )
  );

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_character_cards_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER character_cards_updated_at
  BEFORE UPDATE ON character_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_character_cards_updated_at();

-- Add comments for documentation
COMMENT ON TABLE character_cards IS 'Cards that reference characters as reusable templates';
COMMENT ON COLUMN character_cards.character_id IS 'Reference to the character this card represents';
COMMENT ON COLUMN character_cards.title IS 'Optional override for card title (uses character name if null)';
COMMENT ON COLUMN character_cards.content IS 'Optional override for card content (uses character appearance if null)';
COMMENT ON COLUMN character_cards.image_index IS 'Index of character image to display (0-3)';
COMMENT ON COLUMN character_cards.show_avatar IS 'If true, display avatar instead of full character image';
