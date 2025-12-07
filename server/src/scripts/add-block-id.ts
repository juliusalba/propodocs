import supabase from '../db/index.js';

async function addBlockIdColumn() {
    try {
        console.log('Adding block_id column to proposal_comments table...');

        // Use raw SQL query via Supabase
        const { data, error } = await supabase.rpc('exec_sql', {
            query: `
                ALTER TABLE proposal_comments 
                ADD COLUMN IF NOT EXISTS block_id TEXT;
                
                CREATE INDEX IF NOT EXISTS idx_proposal_comments_block_id 
                ON proposal_comments(proposal_id, block_id);
            `
        });

        if (error) {
            console.error('Error:', error);
            throw error;
        }

        console.log('✅ Successfully added block_id column!');
        console.log('Data:', data);
    } catch (error) {
        console.error('Failed to add column:', error);
        process.exit(1);
    }
}

addBlockIdColumn();
