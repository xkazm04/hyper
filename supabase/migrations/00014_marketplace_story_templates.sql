-- Story Template Marketplace Enhancements
-- Adds support for story graph templates, versioning, purchases, and enhanced royalty management

-- ============================================================================
-- Add story_template as asset type and enhance character_assets for templates
-- ============================================================================

-- Add story template fields to character_assets
ALTER TABLE character_assets
  ADD COLUMN IF NOT EXISTS story_template_data JSONB, -- { storyStack, storyCards, choices }
  ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS version_notes TEXT,
  ADD COLUMN IF NOT EXISTS previous_version_id UUID REFERENCES character_assets(id),
  ADD COLUMN IF NOT EXISTS is_latest_version BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS demo_url TEXT, -- Optional live demo link
  ADD COLUMN IF NOT EXISTS documentation TEXT, -- Markdown documentation
  ADD COLUMN IF NOT EXISTS compatibility_info JSONB DEFAULT '{}'; -- { minVersion, features }

-- Update asset type constraint to include story_template
ALTER TABLE character_assets DROP CONSTRAINT IF EXISTS character_assets_asset_type_check;
ALTER TABLE character_assets ADD CONSTRAINT character_assets_asset_type_check
  CHECK (asset_type IN ('character', 'prompt_template', 'avatar_set', 'character_pack', 'story_template'));

-- ============================================================================
-- Asset Purchases table - Track actual purchases (vs free downloads)
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_purchases (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES character_assets(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Purchase details
  price_paid DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Royalty split
  creator_amount DECIMAL(10,2) NOT NULL,
  platform_amount DECIMAL(10,2) NOT NULL,

  -- Payment reference (for Stripe/payment provider)
  payment_provider TEXT DEFAULT 'stripe',
  payment_intent_id TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),

  -- License granted
  license_type TEXT NOT NULL,
  license_key UUID DEFAULT uuid_generate_v4(),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Asset Versions table - Track version history
-- ============================================================================
CREATE TABLE IF NOT EXISTS asset_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES character_assets(id) ON DELETE CASCADE NOT NULL,

  -- Version info
  version TEXT NOT NULL,
  version_notes TEXT,

  -- Snapshot of asset data at this version
  asset_data JSONB NOT NULL, -- Full copy of asset fields

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(asset_id, version)
);

-- ============================================================================
-- Payout Requests table - Creator payout management
-- ============================================================================
CREATE TABLE IF NOT EXISTS payout_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Payout details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  payout_method TEXT DEFAULT 'bank_transfer' CHECK (payout_method IN ('bank_transfer', 'paypal', 'stripe_connect')),

  -- Payment info (encrypted in production)
  payout_details JSONB, -- { accountNumber, routingNumber } or { paypalEmail }

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  processed_at TIMESTAMP WITH TIME ZONE,
  processed_by UUID REFERENCES auth.users(id),

  -- Reference
  reference_number TEXT,
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_asset_purchases_asset ON asset_purchases(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_purchases_user ON asset_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_asset_purchases_status ON asset_purchases(payment_status);
CREATE INDEX IF NOT EXISTS idx_asset_purchases_created ON asset_purchases(created_at);

CREATE INDEX IF NOT EXISTS idx_asset_versions_asset ON asset_versions(asset_id);
CREATE INDEX IF NOT EXISTS idx_asset_versions_version ON asset_versions(version);

CREATE INDEX IF NOT EXISTS idx_payout_requests_creator ON payout_requests(creator_id);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON payout_requests(status);

CREATE INDEX IF NOT EXISTS idx_character_assets_version ON character_assets(version);
CREATE INDEX IF NOT EXISTS idx_character_assets_latest ON character_assets(is_latest_version) WHERE is_latest_version = true;
CREATE INDEX IF NOT EXISTS idx_character_assets_story_template ON character_assets(asset_type) WHERE asset_type = 'story_template';

-- ============================================================================
-- Enable RLS
-- ============================================================================
ALTER TABLE asset_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payout_requests ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for asset_purchases
-- ============================================================================
CREATE POLICY "Users can view own purchases"
  ON asset_purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create purchases"
  ON asset_purchases FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can view purchases of their assets"
  ON asset_purchases FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM character_assets
      WHERE character_assets.id = asset_purchases.asset_id
      AND character_assets.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies for asset_versions
-- ============================================================================
CREATE POLICY "Everyone can view versions of published assets"
  ON asset_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM character_assets
      WHERE character_assets.id = asset_versions.asset_id
      AND character_assets.is_published = true
      AND character_assets.approval_status = 'approved'
    )
  );

CREATE POLICY "Creators can manage versions of own assets"
  ON asset_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM character_assets
      WHERE character_assets.id = asset_versions.asset_id
      AND character_assets.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies for payout_requests
-- ============================================================================
CREATE POLICY "Users can view own payout requests"
  ON payout_requests FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create own payout requests"
  ON payout_requests FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own pending payout requests"
  ON payout_requests FOR UPDATE
  USING (creator_id = auth.uid() AND status = 'pending');

-- ============================================================================
-- Function to record a purchase and create creator earnings
-- ============================================================================
CREATE OR REPLACE FUNCTION record_asset_purchase(
  p_asset_id UUID,
  p_user_id UUID,
  p_price DECIMAL,
  p_payment_intent_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_asset RECORD;
  v_creator_amount DECIMAL;
  v_platform_amount DECIMAL;
  v_purchase_id UUID;
BEGIN
  -- Get asset details
  SELECT * INTO v_asset FROM character_assets WHERE id = p_asset_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  -- Calculate royalty split (platform takes remaining after creator cut)
  v_creator_amount := p_price * (v_asset.royalty_percentage / 100);
  v_platform_amount := p_price - v_creator_amount;

  -- Create purchase record
  INSERT INTO asset_purchases (
    asset_id, user_id, price_paid, creator_amount, platform_amount,
    payment_intent_id, payment_status, license_type
  ) VALUES (
    p_asset_id, p_user_id, p_price, v_creator_amount, v_platform_amount,
    p_payment_intent_id, 'completed', v_asset.license_type
  ) RETURNING id INTO v_purchase_id;

  -- Create creator earning record
  INSERT INTO creator_earnings (creator_id, asset_id, amount, status)
  VALUES (v_asset.creator_id, p_asset_id, v_creator_amount, 'pending');

  -- Increment download count (purchases also count as downloads)
  PERFORM increment_asset_downloads(p_asset_id);

  RETURN v_purchase_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to create a new version of an asset
-- ============================================================================
CREATE OR REPLACE FUNCTION create_asset_version(
  p_asset_id UUID,
  p_version TEXT,
  p_version_notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_asset RECORD;
  v_version_id UUID;
BEGIN
  -- Get current asset data
  SELECT * INTO v_asset FROM character_assets WHERE id = p_asset_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Asset not found';
  END IF;

  -- Create version snapshot
  INSERT INTO asset_versions (asset_id, version, version_notes, asset_data, created_by)
  VALUES (
    p_asset_id,
    p_version,
    p_version_notes,
    to_jsonb(v_asset),
    auth.uid()
  ) RETURNING id INTO v_version_id;

  -- Update asset with new version
  UPDATE character_assets
  SET version = p_version, version_notes = p_version_notes, updated_at = NOW()
  WHERE id = p_asset_id;

  RETURN v_version_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to calculate creator balance
-- ============================================================================
CREATE OR REPLACE FUNCTION get_creator_balance(p_creator_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_earned DECIMAL;
  v_total_paid DECIMAL;
BEGIN
  -- Sum pending earnings
  SELECT COALESCE(SUM(amount), 0) INTO v_total_earned
  FROM creator_earnings
  WHERE creator_id = p_creator_id AND status = 'pending';

  -- Sum completed payouts
  SELECT COALESCE(SUM(amount), 0) INTO v_total_paid
  FROM payout_requests
  WHERE creator_id = p_creator_id AND status = 'completed';

  RETURN v_total_earned;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Trigger to update payout_requests updated_at
-- ============================================================================
CREATE TRIGGER update_payout_requests_updated_at
  BEFORE UPDATE ON payout_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
