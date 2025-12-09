-- Add contract_id to invoices table for linking invoices to contracts
-- This enables tracking which invoices are associated with which contracts

-- Add contract_id column
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS contract_id INTEGER REFERENCES contracts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_invoices_contract_id ON invoices(contract_id);

-- Add comment for documentation
COMMENT ON COLUMN invoices.contract_id IS 'Optional reference to the contract this invoice is associated with';
