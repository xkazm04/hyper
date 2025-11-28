-- Character Asset Marketplace tables
-- Allows creators to publish AI-generated character assets and prompt templates

-- ============================================================================
-- Character Assets table - Core marketplace listings
-- ============================================================================
CREATE TABLE character_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Basic info
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,

  -- Asset type
  asset_type TEXT NOT NULL CHECK (asset_type IN ('character', 'prompt_template', 'avatar_set', 'character_pack')),

  -- Content
  thumbnail_url TEXT,
  preview_images TEXT[] DEFAULT '{}',

  -- For character type: store character data
  character_data JSONB, -- { name, appearance, imageUrls, imagePrompts, avatarUrl, avatarPrompt }

  -- For prompt_template type: store template
  prompt_template JSONB, -- { template, variables, category, style }

  -- Tags and categories
  tags TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('fantasy', 'sci-fi', 'modern', 'historical', 'horror', 'anime', 'realistic', 'cartoon', 'other')),

  -- Licensing
  license_type TEXT NOT NULL DEFAULT 'free' CHECK (license_type IN ('free', 'attribution', 'non-commercial', 'commercial', 'exclusive')),

  -- Pricing (for future royalties)
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2) DEFAULT 0,
  royalty_percentage DECIMAL(5,2) DEFAULT 0, -- Creator's cut of sales

  -- Metrics
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,

  -- Status
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  is_curated BOOLEAN DEFAULT false, -- Part of curated collection

  -- Approval workflow
  approval_status TEXT NOT NULL DEFAULT 'draft' CHECK (approval_status IN ('draft', 'pending_review', 'approved', 'rejected', 'needs_changes')),
  approval_notes TEXT,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- ============================================================================
-- Curated Collections - Group approved assets into themed collections
-- ============================================================================
CREATE TABLE curated_collections (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  curator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  name TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  thumbnail_url TEXT,

  -- Collection type
  collection_type TEXT NOT NULL CHECK (collection_type IN ('featured', 'staff_picks', 'themed', 'seasonal', 'new_creators')),

  -- Display
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Collection Assets - Join table for collections and assets
-- ============================================================================
CREATE TABLE collection_assets (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  collection_id UUID REFERENCES curated_collections(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES character_assets(id) ON DELETE CASCADE NOT NULL,
  display_order INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(collection_id, asset_id)
);

-- ============================================================================
-- Asset Downloads - Track who downloaded what
-- ============================================================================
CREATE TABLE asset_downloads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES character_assets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  story_stack_id UUID REFERENCES story_stacks(id) ON DELETE SET NULL, -- Optional: which story used it
  downloaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(asset_id, user_id, story_stack_id)
);

-- ============================================================================
-- Asset Reviews - User ratings and reviews
-- ============================================================================
CREATE TABLE asset_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  asset_id UUID REFERENCES character_assets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(asset_id, user_id)
);

-- ============================================================================
-- API Keys - For external services to access the marketplace
-- ============================================================================
CREATE TABLE marketplace_api_keys (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  name TEXT NOT NULL, -- e.g., "My Game Studio Integration"
  key_hash TEXT NOT NULL, -- Hashed API key (original shown only once)
  key_prefix TEXT NOT NULL, -- First 8 chars for identification (e.g., "hyper_sk_")

  -- Permissions
  scopes TEXT[] DEFAULT '{"read:assets"}', -- read:assets, embed:assets, download:assets

  -- Rate limiting
  rate_limit INTEGER DEFAULT 1000, -- Requests per hour

  -- Status
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE -- NULL means never expires
);

-- ============================================================================
-- API Usage Logs - Track API calls for billing and analytics
-- ============================================================================
CREATE TABLE api_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  api_key_id UUID REFERENCES marketplace_api_keys(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  endpoint TEXT NOT NULL,
  method TEXT NOT NULL,
  asset_id UUID REFERENCES character_assets(id) ON DELETE SET NULL,

  response_status INTEGER,
  response_time_ms INTEGER,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Creator Earnings - Track royalties (for future payment integration)
-- ============================================================================
CREATE TABLE creator_earnings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  asset_id UUID REFERENCES character_assets(id) ON DELETE SET NULL,

  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'paid', 'failed')),

  -- Payment info
  paid_at TIMESTAMP WITH TIME ZONE,
  payout_reference TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- Indexes for performance
-- ============================================================================
CREATE INDEX idx_character_assets_creator ON character_assets(creator_id);
CREATE INDEX idx_character_assets_slug ON character_assets(slug);
CREATE INDEX idx_character_assets_type ON character_assets(asset_type);
CREATE INDEX idx_character_assets_category ON character_assets(category);
CREATE INDEX idx_character_assets_published ON character_assets(is_published) WHERE is_published = true;
CREATE INDEX idx_character_assets_featured ON character_assets(is_featured) WHERE is_featured = true;
CREATE INDEX idx_character_assets_curated ON character_assets(is_curated) WHERE is_curated = true;
CREATE INDEX idx_character_assets_approval ON character_assets(approval_status);
CREATE INDEX idx_character_assets_tags ON character_assets USING GIN(tags);
CREATE INDEX idx_character_assets_downloads ON character_assets(downloads DESC);
CREATE INDEX idx_character_assets_rating ON character_assets(rating DESC);

CREATE INDEX idx_curated_collections_slug ON curated_collections(slug);
CREATE INDEX idx_curated_collections_active ON curated_collections(is_active) WHERE is_active = true;
CREATE INDEX idx_curated_collections_type ON curated_collections(collection_type);

CREATE INDEX idx_collection_assets_collection ON collection_assets(collection_id);
CREATE INDEX idx_collection_assets_asset ON collection_assets(asset_id);

CREATE INDEX idx_asset_downloads_asset ON asset_downloads(asset_id);
CREATE INDEX idx_asset_downloads_user ON asset_downloads(user_id);

CREATE INDEX idx_asset_reviews_asset ON asset_reviews(asset_id);
CREATE INDEX idx_asset_reviews_user ON asset_reviews(user_id);

CREATE INDEX idx_api_keys_user ON marketplace_api_keys(user_id);
CREATE INDEX idx_api_keys_prefix ON marketplace_api_keys(key_prefix);
CREATE INDEX idx_api_keys_active ON marketplace_api_keys(is_active) WHERE is_active = true;

CREATE INDEX idx_api_usage_key ON api_usage_logs(api_key_id);
CREATE INDEX idx_api_usage_created ON api_usage_logs(created_at);

CREATE INDEX idx_creator_earnings_creator ON creator_earnings(creator_id);
CREATE INDEX idx_creator_earnings_status ON creator_earnings(status);

-- ============================================================================
-- Enable RLS
-- ============================================================================
ALTER TABLE character_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE curated_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE collection_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE asset_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_earnings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies for character_assets
-- ============================================================================
CREATE POLICY "Everyone can view published assets"
  ON character_assets FOR SELECT
  USING (is_published = true AND approval_status = 'approved');

CREATE POLICY "Users can view own assets"
  ON character_assets FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create own assets"
  ON character_assets FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own assets"
  ON character_assets FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own assets"
  ON character_assets FOR DELETE
  USING (creator_id = auth.uid());

-- ============================================================================
-- RLS Policies for curated_collections
-- ============================================================================
CREATE POLICY "Everyone can view active collections"
  ON curated_collections FOR SELECT
  USING (is_active = true);

CREATE POLICY "Curators can manage collections"
  ON curated_collections FOR ALL
  USING (curator_id = auth.uid());

-- ============================================================================
-- RLS Policies for collection_assets
-- ============================================================================
CREATE POLICY "Everyone can view collection assets"
  ON collection_assets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM curated_collections
      WHERE curated_collections.id = collection_assets.collection_id
      AND curated_collections.is_active = true
    )
  );

-- ============================================================================
-- RLS Policies for asset_downloads
-- ============================================================================
CREATE POLICY "Users can view own downloads"
  ON asset_downloads FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create downloads"
  ON asset_downloads FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Creators can view their asset downloads"
  ON asset_downloads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM character_assets
      WHERE character_assets.id = asset_downloads.asset_id
      AND character_assets.creator_id = auth.uid()
    )
  );

-- ============================================================================
-- RLS Policies for asset_reviews
-- ============================================================================
CREATE POLICY "Everyone can view reviews"
  ON asset_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON asset_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON asset_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON asset_reviews FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS Policies for marketplace_api_keys
-- ============================================================================
CREATE POLICY "Users can view own API keys"
  ON marketplace_api_keys FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own API keys"
  ON marketplace_api_keys FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own API keys"
  ON marketplace_api_keys FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own API keys"
  ON marketplace_api_keys FOR DELETE
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS Policies for api_usage_logs
-- ============================================================================
CREATE POLICY "Users can view own API usage"
  ON api_usage_logs FOR SELECT
  USING (user_id = auth.uid());

-- ============================================================================
-- RLS Policies for creator_earnings
-- ============================================================================
CREATE POLICY "Users can view own earnings"
  ON creator_earnings FOR SELECT
  USING (creator_id = auth.uid());

-- ============================================================================
-- Triggers for updated_at
-- ============================================================================
CREATE TRIGGER update_character_assets_updated_at
  BEFORE UPDATE ON character_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_curated_collections_updated_at
  BEFORE UPDATE ON curated_collections
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_asset_reviews_updated_at
  BEFORE UPDATE ON asset_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Function to update asset rating when review is added/updated/deleted
-- ============================================================================
CREATE OR REPLACE FUNCTION update_asset_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE character_assets
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)::DECIMAL(2,1)
      FROM asset_reviews
      WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM asset_reviews
      WHERE asset_id = COALESCE(NEW.asset_id, OLD.asset_id)
    )
  WHERE id = COALESCE(NEW.asset_id, OLD.asset_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_asset_review_change
  AFTER INSERT OR UPDATE OR DELETE ON asset_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_asset_rating();

-- ============================================================================
-- Function to increment download count
-- ============================================================================
CREATE OR REPLACE FUNCTION increment_asset_downloads(p_asset_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE character_assets
  SET downloads = downloads + 1
  WHERE id = p_asset_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function to generate unique asset slug
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_asset_slug(asset_name TEXT, asset_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(asset_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- If slug is empty, use 'asset'
  IF base_slug = '' THEN
    base_slug := 'asset';
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM character_assets WHERE slug = final_slug AND id != asset_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Function to generate collection slug
-- ============================================================================
CREATE OR REPLACE FUNCTION generate_collection_slug(collection_name TEXT, collection_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(collection_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- If slug is empty, use 'collection'
  IF base_slug = '' THEN
    base_slug := 'collection';
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM curated_collections WHERE slug = final_slug AND id != collection_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
