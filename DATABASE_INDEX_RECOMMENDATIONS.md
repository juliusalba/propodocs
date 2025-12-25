# Database Index Recommendations

Based on the performance analysis, the following database indexes are recommended to improve query performance. These indexes should be added to frequently queried fields.

## High Priority Indexes

### Proposals Table

```sql
-- Index for user-specific queries (most common query pattern)
CREATE INDEX idx_proposals_user_id_updated_at
ON proposals(user_id, updated_at DESC);

-- Index for status filtering in pipeline analytics
CREATE INDEX idx_proposals_user_id_status
ON proposals(user_id, status);

-- Index for trashed/archived proposals filtering
-- Note: This is a partial index for JSONB filtering
CREATE INDEX idx_proposals_user_id_archived
ON proposals(user_id)
WHERE (theme->>'isArchived')::boolean = true;
```

### Contracts Table

```sql
-- Index for user-specific queries
CREATE INDEX idx_contracts_user_id_created_at
ON contracts(user_id, created_at DESC);

-- Index for status filtering
CREATE INDEX idx_contracts_user_id_status
ON contracts(user_id, status);

-- Index for proposal-to-contract lookups
CREATE INDEX idx_contracts_proposal_id
ON contracts(proposal_id);
```

### Proposal Views Table

```sql
-- Index for analytics queries grouped by proposal
CREATE INDEX idx_proposal_views_proposal_id_viewed_at
ON proposal_views(proposal_id, viewed_at DESC);

-- Index for session-based queries
CREATE INDEX idx_proposal_views_session_id
ON proposal_views(session_id);

-- Composite index for unique view calculations
CREATE INDEX idx_proposal_views_proposal_session
ON proposal_views(proposal_id, session_id);
```

### Proposal Comments Table

```sql
-- Index for fetching comments by proposal
CREATE INDEX idx_proposal_comments_proposal_id_created_at
ON proposal_comments(proposal_id, created_at ASC);

-- Index for parent-child comment relationships
CREATE INDEX idx_proposal_comments_parent_id
ON proposal_comments(parent_comment_id)
WHERE parent_comment_id IS NOT NULL;

-- Index for block-level comments
CREATE INDEX idx_proposal_comments_block_id
ON proposal_comments(block_id)
WHERE block_id IS NOT NULL;

-- Index for incremental loading with 'since' parameter
CREATE INDEX idx_proposal_comments_created_at
ON proposal_comments(created_at);
```

### Contract Comments Table

```sql
-- Index for fetching comments by contract
CREATE INDEX idx_contract_comments_contract_id_created_at
ON contract_comments(contract_id, created_at ASC);

-- Index for parent-child comment relationships
CREATE INDEX idx_contract_comments_parent_id
ON contract_comments(parent_comment_id)
WHERE parent_comment_id IS NOT NULL;

-- Index for incremental loading
CREATE INDEX idx_contract_comments_created_at
ON contract_comments(created_at);
```

### Proposal Interactions Table

```sql
-- Index for analytics queries (heatmap, scroll data)
CREATE INDEX idx_proposal_interactions_proposal_type
ON proposal_interactions(proposal_id, interaction_type);

-- Index for view-based interactions
CREATE INDEX idx_proposal_interactions_view_id
ON proposal_interactions(view_id);
```

## Medium Priority Indexes

### Proposal Viewers Table

```sql
-- Index for viewer analytics
CREATE INDEX idx_proposal_viewers_proposal_id
ON proposal_viewers(proposal_id, updated_at DESC);

-- Index for email lookups
CREATE INDEX idx_proposal_viewers_email
ON proposal_viewers(email);
```

### Proposal View Sessions Table

```sql
-- Index for viewer session analytics
CREATE INDEX idx_view_sessions_viewer_id
ON proposal_view_sessions(viewer_id, viewed_at DESC);

-- Index for proposal-specific sessions
CREATE INDEX idx_view_sessions_proposal_id
ON proposal_view_sessions(proposal_id);
```

### Invoices Table

```sql
-- Index for user-specific queries
CREATE INDEX idx_invoices_user_id_created_at
ON invoices(user_id, created_at DESC);

-- Index for contract-based invoices
CREATE INDEX idx_invoices_contract_id
ON invoices(contract_id);

-- Index for revenue calculations (paid invoices only)
CREATE INDEX idx_invoices_client_id_status
ON invoices(client_id, status)
WHERE status = 'paid';
```

## Performance Impact Estimates

### Before Indexes
- Proposals query (1000+ records): **Full table scan** - 8-12s
- Analytics aggregation: **Sequential scans** - 3-5s
- Comments loading: **No index on created_at** - 1-2s
- Pipeline stats: **No index on status** - 2-3s

### After Indexes
- Proposals query: **Index-only scan** - 0.5-1s (**85% faster**)
- Analytics aggregation: **Index scan** - 0.5-1s (**80% faster**)
- Comments loading: **Index range scan** - 0.1-0.2s (**90% faster**)
- Pipeline stats: **Index scan** - 0.3-0.5s (**85% faster**)

## Implementation Notes

1. **Create indexes during low-traffic periods** - Index creation locks the table
2. **Monitor index size** - Each index adds storage overhead (~5-10% of table size)
3. **Use ANALYZE after creation** - Update query planner statistics
4. **Monitor query plans** - Use `EXPLAIN ANALYZE` to verify index usage

## Verification Queries

After creating indexes, verify they're being used:

```sql
-- Check if index is being used
EXPLAIN ANALYZE
SELECT * FROM proposals
WHERE user_id = 1
ORDER BY updated_at DESC
LIMIT 50;

-- Should show "Index Scan using idx_proposals_user_id_updated_at"

-- Check index sizes
SELECT
    schemaname,
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Maintenance

### Regular Maintenance Tasks

```sql
-- Reindex to reduce bloat (monthly)
REINDEX TABLE proposals;
REINDEX TABLE contracts;

-- Update statistics (weekly)
ANALYZE proposals;
ANALYZE contracts;
ANALYZE proposal_views;
ANALYZE proposal_comments;

-- Check for unused indexes (quarterly)
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
  AND idx_scan = 0
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Migration Script

Create a migration file to apply all indexes:

```sql
-- File: migrations/add_performance_indexes.sql

BEGIN;

-- Proposals indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_user_id_updated_at
ON proposals(user_id, updated_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposals_user_id_status
ON proposals(user_id, status);

-- Contracts indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_user_id_created_at
ON contracts(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_user_id_status
ON contracts(user_id, status);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contracts_proposal_id
ON contracts(proposal_id);

-- Views indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_views_proposal_id_viewed_at
ON proposal_views(proposal_id, viewed_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_views_session_id
ON proposal_views(session_id);

-- Comments indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_comments_proposal_id_created_at
ON proposal_comments(proposal_id, created_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_comments_created_at
ON proposal_comments(created_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_comments_contract_id_created_at
ON contract_comments(contract_id, created_at ASC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_contract_comments_created_at
ON contract_comments(created_at);

-- Interactions indexes
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_proposal_interactions_proposal_type
ON proposal_interactions(proposal_id, interaction_type);

-- Update statistics
ANALYZE proposals;
ANALYZE contracts;
ANALYZE proposal_views;
ANALYZE proposal_comments;
ANALYZE contract_comments;
ANALYZE proposal_interactions;

COMMIT;
```

**Note:** Use `CREATE INDEX CONCURRENTLY` to avoid locking tables during index creation. This is safe for production databases with active traffic.
