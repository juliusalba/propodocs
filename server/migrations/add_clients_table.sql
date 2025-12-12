-- Drop the clients table if it exists (to start fresh)
DROP TABLE IF EXISTS clients CASCADE;

-- Create clients table for centralized client management
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    company VARCHAR(200),
    phone VARCHAR(50),
    address TEXT,
    notes TEXT,
    tags TEXT[],
    status VARCHAR(50) DEFAULT 'active',
    total_revenue NUMERIC(12,2) DEFAULT 0,
    proposal_count INT DEFAULT 0,
    contract_count INT DEFAULT 0,
    invoice_count INT DEFAULT 0,
    last_contact_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add client_id foreign key to proposals
ALTER TABLE proposals ADD COLUMN IF NOT EXISTS client_id INT REFERENCES clients(id) ON DELETE SET NULL;

-- Add client_id foreign key to invoices
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS client_id INT REFERENCES clients(id) ON DELETE SET NULL;

-- Add client_id foreign key to contracts
ALTER TABLE contracts ADD COLUMN IF NOT EXISTS client_id INT REFERENCES clients(id) ON DELETE SET NULL;

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_proposals_client_id ON proposals(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_contracts_client_id ON contracts(client_id);

-- Comments
COMMENT ON TABLE clients IS 'Centralized client management for CRM functionality';
COMMENT ON COLUMN clients.total_revenue IS 'Cached sum of paid invoices for quick display';
