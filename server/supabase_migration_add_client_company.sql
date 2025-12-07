-- Migration: Add client_company column to proposals table
-- Run this in your Supabase SQL Editor

-- Add client_company column to proposals table
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_company text;

-- Add client_email column if needed for future use
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS client_email text;

-- Add view_count column for caching view counts (optional optimization)
ALTER TABLE public.proposals 
ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'proposals' 
ORDER BY ordinal_position;