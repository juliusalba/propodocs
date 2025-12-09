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

-- Add RLS policies
ALTER TABLE contract_comments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read comments on contracts they own
CREATE POLICY "Users can read own contract comments" ON contract_comments
    FOR SELECT
    USING (
        contract_id IN (
            SELECT id FROM contracts WHERE user_id = auth.uid()::integer
        )
    );

-- Allow inserting comments (for both internal users and external clients via token)
CREATE POLICY "Allow inserting contract comments" ON contract_comments
    FOR INSERT
    WITH CHECK (true);

-- Allow users to update their own contract comments
CREATE POLICY "Users can update own contract comments" ON contract_comments
    FOR UPDATE
    USING (
        contract_id IN (
            SELECT id FROM contracts WHERE user_id = auth.uid()::integer
        )
    );

-- Add comment counts to contracts queries
COMMENT ON TABLE contract_comments IS 'Comments on contracts for collaboration between users and clients';
