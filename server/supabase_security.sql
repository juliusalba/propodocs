-- =====================================================
-- VMG Pricing Calculator - Supabase Security Policies
-- =====================================================
-- This file contains Row Level Security (RLS) policies
-- for all tables in the database.
--
-- IMPORTANT: Since this app uses a custom backend with JWT
-- authentication (not Supabase Auth), the backend uses the
-- service_role key which bypasses RLS. These policies provide
-- an additional security layer and protect against direct
-- database access.
-- =====================================================

-- =====================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- =====================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can only read their own data (via anon key if ever used)
CREATE POLICY "users_select_own" ON public.users
    FOR SELECT
    USING (false); -- Deny all direct access, backend handles this

-- Only backend can insert users (via service_role)
CREATE POLICY "users_insert_backend" ON public.users
    FOR INSERT
    WITH CHECK (false); -- Deny anon inserts

-- Users can only update their own data
CREATE POLICY "users_update_own" ON public.users
    FOR UPDATE
    USING (false); -- Deny all direct access

-- Prevent direct deletion
CREATE POLICY "users_delete_none" ON public.users
    FOR DELETE
    USING (false);

-- =====================================================
-- PROPOSALS TABLE POLICIES
-- =====================================================

-- Proposals can only be read by their owner
CREATE POLICY "proposals_select_own" ON public.proposals
    FOR SELECT
    USING (false); -- Backend handles authorization

-- Only authenticated users can create proposals
CREATE POLICY "proposals_insert_auth" ON public.proposals
    FOR INSERT
    WITH CHECK (false); -- Backend handles this

-- Users can only update their own proposals
CREATE POLICY "proposals_update_own" ON public.proposals
    FOR UPDATE
    USING (false);

-- Users can only delete their own proposals
CREATE POLICY "proposals_delete_own" ON public.proposals
    FOR DELETE
    USING (false);

-- =====================================================
-- PROPOSAL LINKS TABLE POLICIES
-- =====================================================

-- Links can be read if they belong to user's proposal
CREATE POLICY "proposal_links_select" ON public.proposal_links
    FOR SELECT
    USING (false);

CREATE POLICY "proposal_links_insert" ON public.proposal_links
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "proposal_links_update" ON public.proposal_links
    FOR UPDATE
    USING (false);

CREATE POLICY "proposal_links_delete" ON public.proposal_links
    FOR DELETE
    USING (false);

-- =====================================================
-- PROPOSAL VIEWS TABLE POLICIES (Analytics)
-- =====================================================

-- Views are read-only for proposal owners
CREATE POLICY "proposal_views_select" ON public.proposal_views
    FOR SELECT
    USING (false);

-- Anyone can insert views (for tracking)
CREATE POLICY "proposal_views_insert" ON public.proposal_views
    FOR INSERT
    WITH CHECK (false);

-- No updates allowed
CREATE POLICY "proposal_views_update" ON public.proposal_views
    FOR UPDATE
    USING (false);

-- No deletes allowed
CREATE POLICY "proposal_views_delete" ON public.proposal_views
    FOR DELETE
    USING (false);

-- =====================================================
-- PROPOSAL INTERACTIONS TABLE POLICIES
-- =====================================================

CREATE POLICY "proposal_interactions_select" ON public.proposal_interactions
    FOR SELECT
    USING (false);

CREATE POLICY "proposal_interactions_insert" ON public.proposal_interactions
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "proposal_interactions_update" ON public.proposal_interactions
    FOR UPDATE
    USING (false);

CREATE POLICY "proposal_interactions_delete" ON public.proposal_interactions
    FOR DELETE
    USING (false);

-- =====================================================
-- PROPOSAL COMMENTS TABLE POLICIES
-- =====================================================

CREATE POLICY "proposal_comments_select" ON public.proposal_comments
    FOR SELECT
    USING (false);

CREATE POLICY "proposal_comments_insert" ON public.proposal_comments
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "proposal_comments_update" ON public.proposal_comments
    FOR UPDATE
    USING (false);

CREATE POLICY "proposal_comments_delete" ON public.proposal_comments
    FOR DELETE
    USING (false);

-- =====================================================
-- PROPOSAL TEMPLATES TABLE POLICIES
-- =====================================================

-- Users can see their own templates and public templates
CREATE POLICY "proposal_templates_select" ON public.proposal_templates
    FOR SELECT
    USING (false);

CREATE POLICY "proposal_templates_insert" ON public.proposal_templates
    FOR INSERT
    WITH CHECK (false);

CREATE POLICY "proposal_templates_update" ON public.proposal_templates
    FOR UPDATE
    USING (false);

CREATE POLICY "proposal_templates_delete" ON public.proposal_templates
    FOR DELETE
    USING (false);

-- =====================================================
-- NOTIFICATIONS TABLE POLICIES
-- =====================================================

-- Users can only see their own notifications
CREATE POLICY "notifications_select_own" ON public.notifications
    FOR SELECT
    USING (false);

CREATE POLICY "notifications_insert" ON public.notifications
    FOR INSERT
    WITH CHECK (false);

-- Users can update (mark as read) their own notifications
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE
    USING (false);

CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE
    USING (false);

-- =====================================================
-- ADDITIONAL SECURITY MEASURES
-- =====================================================

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at on relevant tables
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposals_updated_at ON public.proposals;
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON public.proposals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_proposal_templates_updated_at ON public.proposal_templates;
CREATE TRIGGER update_proposal_templates_updated_at
    BEFORE UPDATE ON public.proposal_templates
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- ADDITIONAL INDEXES FOR SECURITY AND PERFORMANCE
-- =====================================================

-- Index for faster user lookups by email (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- Index for faster notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(user_id, is_read);

-- Index for proposal status queries
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_user_status ON public.proposals(user_id, status);

-- Index for link expiration checks
CREATE INDEX IF NOT EXISTS idx_proposal_links_expires ON public.proposal_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_proposal_links_active ON public.proposal_links(is_active);

-- Index for template queries
CREATE INDEX IF NOT EXISTS idx_proposal_templates_user_id ON public.proposal_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_public ON public.proposal_templates(is_public);

-- =====================================================
-- GRANT STATEMENTS
-- =====================================================
-- The service_role key bypasses RLS, but we still need
-- to ensure proper grants are in place.

-- Revoke all from anon (public access)
REVOKE ALL ON public.users FROM anon;
REVOKE ALL ON public.proposals FROM anon;
REVOKE ALL ON public.proposal_links FROM anon;
REVOKE ALL ON public.proposal_views FROM anon;
REVOKE ALL ON public.proposal_interactions FROM anon;
REVOKE ALL ON public.proposal_comments FROM anon;
REVOKE ALL ON public.proposal_templates FROM anon;
REVOKE ALL ON public.notifications FROM anon;

-- Grant minimal access to authenticated role (if ever used)
-- Note: With custom JWT auth, this is mainly for future-proofing
GRANT SELECT ON public.users TO authenticated;
GRANT ALL ON public.proposals TO authenticated;
GRANT ALL ON public.proposal_links TO authenticated;
GRANT ALL ON public.proposal_views TO authenticated;
GRANT ALL ON public.proposal_interactions TO authenticated;
GRANT ALL ON public.proposal_comments TO authenticated;
GRANT ALL ON public.proposal_templates TO authenticated;
GRANT ALL ON public.notifications TO authenticated;

-- Grant sequence usage for inserts
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.users IS 'User accounts with hashed passwords for custom JWT authentication';
COMMENT ON TABLE public.proposals IS 'Pricing proposals created by users';
COMMENT ON TABLE public.proposal_links IS 'Shareable links for proposals with optional password protection';
COMMENT ON TABLE public.proposal_views IS 'Analytics tracking for proposal views';
COMMENT ON TABLE public.proposal_interactions IS 'Detailed interaction tracking (clicks, scrolls, etc.)';
COMMENT ON TABLE public.proposal_comments IS 'Comments on proposals from users and clients';
COMMENT ON TABLE public.proposal_templates IS 'Reusable proposal templates';
COMMENT ON TABLE public.notifications IS 'User notifications for proposal events';