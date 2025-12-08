-- =============================================
-- FIX MIGRATION: Add missing columns for contracts
-- Run this in Supabase SQL Editor (Dashboard > SQL)
-- =============================================

-- Add client_signed_at to contracts table
ALTER TABLE public.contracts 
ADD COLUMN IF NOT EXISTS client_signed_at timestamptz;

-- Add signer_type to contract_signatures table
ALTER TABLE public.contract_signatures 
ADD COLUMN IF NOT EXISTS signer_type text DEFAULT 'client';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Fix migration completed! Added: client_signed_at to contracts, signer_type to contract_signatures';
END $$;
