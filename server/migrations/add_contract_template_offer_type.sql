-- =============================================
-- MIGRATION: Add offer_type and category to contract_templates
-- Run this in Supabase SQL Editor
-- =============================================

-- Add new columns to contract_templates
ALTER TABLE public.contract_templates 
ADD COLUMN IF NOT EXISTS offer_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS category VARCHAR(100) DEFAULT 'service_agreement';

-- Create index for faster lookups by offer type
CREATE INDEX IF NOT EXISTS idx_contract_templates_offer 
ON public.contract_templates(offer_type, user_id) 
WHERE offer_type IS NOT NULL;

-- Create index for category filtering
CREATE INDEX IF NOT EXISTS idx_contract_templates_category 
ON public.contract_templates(category, user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.contract_templates.offer_type IS 'Links template to specific service offering (e.g., marine, social_media, seo)';
COMMENT ON COLUMN public.contract_templates.category IS 'Template category (e.g., service_agreement, nda, sow, msa)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed! Added offer_type and category to contract_templates';
END $$;
