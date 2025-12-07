-- Migration: Add 'marketing' and 'custom' calculator types
-- Run this migration in Supabase SQL Editor

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE public.proposals 
DROP CONSTRAINT IF EXISTS proposals_calculator_type_check;

-- Step 2: Add new CHECK constraint with additional types
ALTER TABLE public.proposals 
ADD CONSTRAINT proposals_calculator_type_check 
CHECK (calculator_type IN ('vmg', 'marine', 'marketing', 'custom'));

-- Step 3: Update existing 'vmg' records to 'marketing' (optional, keeps backward compatibility if skipped)
-- Uncomment the line below if you want to migrate existing data:
-- UPDATE public.proposals SET calculator_type = 'marketing' WHERE calculator_type = 'vmg';

-- Verify the migration
SELECT calculator_type, COUNT(*) as count 
FROM public.proposals 
GROUP BY calculator_type;
