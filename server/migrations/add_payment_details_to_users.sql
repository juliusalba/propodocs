-- Add payment details columns to users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS payment_preferences JSONB DEFAULT '{}'::jsonb;

-- Comment on columns
COMMENT ON COLUMN public.users.bank_details IS 'Stores user bank account information for invoices';
COMMENT ON COLUMN public.users.payment_preferences IS 'Stores default payment link configurations';
