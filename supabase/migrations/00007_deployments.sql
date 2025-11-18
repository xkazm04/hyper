-- Create deployments table
CREATE TABLE IF NOT EXISTS deployments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stack_id UUID NOT NULL REFERENCES stacks(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('vercel', 'netlify')),
  status TEXT NOT NULL CHECK (status IN ('pending', 'building', 'ready', 'failed')) DEFAULT 'pending',
  url TEXT,
  deployment_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on stack_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_deployments_stack_id ON deployments(stack_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);

-- Create index on created_at for sorting
CREATE INDEX IF NOT EXISTS idx_deployments_created_at ON deployments(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_deployments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deployments_updated_at
  BEFORE UPDATE ON deployments
  FOR EACH ROW
  EXECUTE FUNCTION update_deployments_updated_at();

-- Enable Row Level Security
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own deployments
CREATE POLICY "Users can view their own deployments"
  ON deployments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = deployments.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- Users can create deployments for their own stacks
CREATE POLICY "Users can create deployments for their own stacks"
  ON deployments
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = deployments.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- Users can update their own deployments
CREATE POLICY "Users can update their own deployments"
  ON deployments
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = deployments.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- Users can delete their own deployments
CREATE POLICY "Users can delete their own deployments"
  ON deployments
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM stacks
      WHERE stacks.id = deployments.stack_id
      AND stacks.owner_id = auth.uid()
    )
  );

-- Add comment to table
COMMENT ON TABLE deployments IS 'Stores deployment records for stacks to Vercel/Netlify';
COMMENT ON COLUMN deployments.stack_id IS 'Reference to the stack being deployed';
COMMENT ON COLUMN deployments.provider IS 'Deployment provider (vercel or netlify)';
COMMENT ON COLUMN deployments.status IS 'Deployment status (pending, building, ready, failed)';
COMMENT ON COLUMN deployments.url IS 'Public URL of the deployed site';
COMMENT ON COLUMN deployments.deployment_url IS 'Provider-specific deployment URL for status checking';
COMMENT ON COLUMN deployments.metadata IS 'Deployment configuration (custom domain, env vars, etc)';
COMMENT ON COLUMN deployments.error_message IS 'Error message if deployment failed';
