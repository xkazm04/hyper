-- Marketplace Packages table
CREATE TABLE packages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  creator_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- 'template', 'component', 'theme', 'utility'
  thumbnail_url TEXT,
  preview_images TEXT[] DEFAULT '{}',

  -- Package content as JSON schema
  package_schema JSONB NOT NULL, -- Complete package definition

  -- Metadata
  downloads INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0.0,
  rating_count INTEGER DEFAULT 0,
  is_featured BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  tags TEXT[] DEFAULT '{}',

  -- Pricing (for future monetization)
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2),

  -- Versioning
  current_version TEXT NOT NULL DEFAULT '1.0.0',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Package Versions table
CREATE TABLE package_versions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  version TEXT NOT NULL,
  changelog TEXT,
  package_schema JSONB NOT NULL, -- Snapshot of package at this version
  downloads INTEGER DEFAULT 0,
  is_stable BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, version)
);

-- Package Installations table (tracks who installed what)
CREATE TABLE package_installations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  package_version_id UUID REFERENCES package_versions(id) ON DELETE SET NULL,
  stack_id UUID REFERENCES stacks(id) ON DELETE CASCADE, -- Optional: track per-stack installations
  installed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(user_id, package_id, stack_id)
);

-- Package Reviews table
CREATE TABLE package_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  package_id UUID REFERENCES packages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(package_id, user_id)
);

-- Indexes for performance
CREATE INDEX idx_packages_creator ON packages(creator_id);
CREATE INDEX idx_packages_slug ON packages(slug);
CREATE INDEX idx_packages_category ON packages(category);
CREATE INDEX idx_packages_featured ON packages(is_featured) WHERE is_featured = true;
CREATE INDEX idx_packages_published ON packages(is_published) WHERE is_published = true;
CREATE INDEX idx_packages_tags ON packages USING GIN(tags);
CREATE INDEX idx_packages_downloads ON packages(downloads DESC);
CREATE INDEX idx_packages_rating ON packages(rating DESC);

CREATE INDEX idx_package_versions_package ON package_versions(package_id);
CREATE INDEX idx_package_installations_user ON package_installations(user_id);
CREATE INDEX idx_package_installations_package ON package_installations(package_id);
CREATE INDEX idx_package_reviews_package ON package_reviews(package_id);

-- Enable RLS
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages
CREATE POLICY "Everyone can view published packages"
  ON packages FOR SELECT
  USING (is_published = true);

CREATE POLICY "Users can view own unpublished packages"
  ON packages FOR SELECT
  USING (creator_id = auth.uid());

CREATE POLICY "Users can create own packages"
  ON packages FOR INSERT
  WITH CHECK (creator_id = auth.uid());

CREATE POLICY "Users can update own packages"
  ON packages FOR UPDATE
  USING (creator_id = auth.uid());

CREATE POLICY "Users can delete own packages"
  ON packages FOR DELETE
  USING (creator_id = auth.uid());

-- RLS Policies for package_versions
CREATE POLICY "Everyone can view versions of published packages"
  ON package_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM packages
      WHERE packages.id = package_versions.package_id
      AND packages.is_published = true
    )
  );

CREATE POLICY "Users can view versions of own packages"
  ON package_versions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM packages
      WHERE packages.id = package_versions.package_id
      AND packages.creator_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage versions of own packages"
  ON package_versions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM packages
      WHERE packages.id = package_versions.package_id
      AND packages.creator_id = auth.uid()
    )
  );

-- RLS Policies for package_installations
CREATE POLICY "Users can view own installations"
  ON package_installations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create own installations"
  ON package_installations FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own installations"
  ON package_installations FOR DELETE
  USING (user_id = auth.uid());

-- RLS Policies for package_reviews
CREATE POLICY "Everyone can view reviews"
  ON package_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create own reviews"
  ON package_reviews FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own reviews"
  ON package_reviews FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own reviews"
  ON package_reviews FOR DELETE
  USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_packages_updated_at
  BEFORE UPDATE ON packages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_package_reviews_updated_at
  BEFORE UPDATE ON package_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to update package rating when review is added/updated
CREATE OR REPLACE FUNCTION update_package_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE packages
  SET
    rating = (
      SELECT COALESCE(AVG(rating), 0)::DECIMAL(2,1)
      FROM package_reviews
      WHERE package_id = COALESCE(NEW.package_id, OLD.package_id)
    ),
    rating_count = (
      SELECT COUNT(*)
      FROM package_reviews
      WHERE package_id = COALESCE(NEW.package_id, OLD.package_id)
    )
  WHERE id = COALESCE(NEW.package_id, OLD.package_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON package_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_package_rating();

-- Function to increment download count
CREATE OR REPLACE FUNCTION increment_package_downloads(p_package_id UUID, p_version_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE packages
  SET downloads = downloads + 1
  WHERE id = p_package_id;

  IF p_version_id IS NOT NULL THEN
    UPDATE package_versions
    SET downloads = downloads + 1
    WHERE id = p_version_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate unique package slug
CREATE OR REPLACE FUNCTION generate_package_slug(package_name TEXT, package_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(package_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);

  -- If slug is empty, use package_id
  IF base_slug = '' THEN
    base_slug := 'package';
  END IF;

  final_slug := base_slug;

  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM packages WHERE slug = final_slug AND id != package_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;

  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
