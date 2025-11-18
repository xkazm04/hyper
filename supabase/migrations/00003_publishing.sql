-- Add publishing fields to stacks table
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
ALTER TABLE stacks ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_stacks_slug ON stacks(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_stacks_featured ON stacks(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_stacks_tags ON stacks USING GIN(tags);

-- Function to generate unique slug
CREATE OR REPLACE FUNCTION generate_stack_slug(stack_name TEXT, stack_id UUID)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Create base slug from name
  base_slug := lower(regexp_replace(stack_name, '[^a-zA-Z0-9]+', '-', 'g'));
  base_slug := trim(both '-' from base_slug);
  
  -- If slug is empty, use stack_id
  IF base_slug = '' THEN
    base_slug := 'stack';
  END IF;
  
  final_slug := base_slug;
  
  -- Check for uniqueness and append counter if needed
  WHILE EXISTS (SELECT 1 FROM stacks WHERE slug = final_slug AND id != stack_id) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;
