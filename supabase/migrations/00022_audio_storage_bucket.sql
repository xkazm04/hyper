-- Create storage bucket for audio narration files
-- Run this in Supabase SQL Editor

-- First, create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'story-audio',
  'story-audio',
  true,  -- Public bucket for audio playback
  10485760,  -- 10MB file size limit
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true;  -- Ensure bucket is public

-- Drop existing policies if they exist (to recreate cleanly)
DROP POLICY IF EXISTS "Users can upload audio to their folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own audio" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can read audio files" ON storage.objects;
DROP POLICY IF EXISTS "Public audio read access" ON storage.objects;

-- Storage policy: Allow authenticated users to upload to their own folder
CREATE POLICY "Users can upload audio to their folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'story-audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Allow authenticated users to update their own audio files
CREATE POLICY "Users can update their own audio"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'story-audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'story-audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Allow authenticated users to delete their own audio files
CREATE POLICY "Users can delete their own audio"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'story-audio' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Storage policy: Allow PUBLIC read access (important for audio playback)
-- This allows anyone (including unauthenticated users) to read audio files
CREATE POLICY "Public audio read access"
ON storage.objects
FOR SELECT
TO anon, authenticated
USING (bucket_id = 'story-audio');
