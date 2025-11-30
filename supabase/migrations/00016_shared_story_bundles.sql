-- Create shared_story_bundles table for storing compiled story bundles with public URLs
CREATE TABLE IF NOT EXISTS shared_story_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_stack_id UUID NOT NULL REFERENCES story_stacks(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Short unique code for the public URL (e.g., "abc123")
  share_code TEXT NOT NULL UNIQUE,

  -- The compiled bundle data (JSON format)
  bundle_data JSONB NOT NULL,

  -- Bundle metadata
  bundle_version TEXT NOT NULL,
  bundle_checksum TEXT NOT NULL,
  bundle_size_bytes INTEGER NOT NULL,

  -- Story metadata snapshot at time of sharing
  story_name TEXT NOT NULL,
  story_description TEXT,
  card_count INTEGER NOT NULL DEFAULT 0,
  choice_count INTEGER NOT NULL DEFAULT 0,
  character_count INTEGER NOT NULL DEFAULT 0,

  -- View tracking
  view_count INTEGER NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- Optional expiration date

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_shared_bundles_share_code ON shared_story_bundles(share_code) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_shared_bundles_story_stack ON shared_story_bundles(story_stack_id);
CREATE INDEX IF NOT EXISTS idx_shared_bundles_user ON shared_story_bundles(user_id);
CREATE INDEX IF NOT EXISTS idx_shared_bundles_created ON shared_story_bundles(created_at DESC);

-- Function to generate unique short share codes
CREATE OR REPLACE FUNCTION generate_share_code()
RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'abcdefghijklmnopqrstuvwxyz0123456789';
  result TEXT := '';
  i INTEGER;
  code_length INTEGER := 8;
BEGIN
  FOR i IN 1..code_length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;

  -- Check for uniqueness and regenerate if needed
  WHILE EXISTS (SELECT 1 FROM shared_story_bundles WHERE share_code = result) LOOP
    result := '';
    FOR i IN 1..code_length LOOP
      result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
    END LOOP;
  END LOOP;

  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE shared_story_bundles ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own shared bundles
CREATE POLICY "Users can view own shared bundles"
  ON shared_story_bundles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can create shared bundles for their own stories
CREATE POLICY "Users can create shared bundles"
  ON shared_story_bundles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM story_stacks
      WHERE story_stacks.id = story_stack_id
      AND story_stacks.user_id = auth.uid()
    )
  );

-- Users can update their own shared bundles
CREATE POLICY "Users can update own shared bundles"
  ON shared_story_bundles
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own shared bundles
CREATE POLICY "Users can delete own shared bundles"
  ON shared_story_bundles
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Public can read active shared bundles (for the player)
CREATE POLICY "Public can view active shared bundles"
  ON shared_story_bundles
  FOR SELECT
  TO anon
  USING (
    is_active = true AND
    (expires_at IS NULL OR expires_at > NOW())
  );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_shared_bundle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_shared_bundle_updated_at
  BEFORE UPDATE ON shared_story_bundles
  FOR EACH ROW
  EXECUTE FUNCTION update_shared_bundle_updated_at();
