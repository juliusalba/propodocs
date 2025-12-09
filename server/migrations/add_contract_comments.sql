-- Create contract_comments table for collaboration on contracts
-- Similar to proposal_comments but for contracts

CREATE TABLE IF NOT EXISTS contract_comments (
    id SERIAL PRIMARY KEY,
    contract_id INTEGER NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    author_name VARCHAR(200) NOT NULL DEFAULT 'Anonymous',
    content TEXT NOT NULL,
    parent_comment_id INTEGER REFERENCES contract_comments(id) ON DELETE CASCADE,
    is_internal BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_contract_comments_contract_id ON contract_comments(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_comments_parent ON contract_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_contract_comments_created ON contract_comments(created_at);

-- Add comment for documentation
COMMENT ON TABLE contract_comments IS 'Comments on contracts for collaboration between users and clients';
