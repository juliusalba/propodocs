import { Router } from 'express';
import { z } from 'zod';
import supabase from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { sendProposalLinkEmail } from '../utils/email.js';
import { notifyProposalStatusChange, notifyCommentAdded } from '../services/notification.js';

const router = Router();

const createProposalSchema = z.object({
    title: z.string().min(1),
    clientName: z.string().min(1),
    clientEmail: z.string().email().optional().or(z.literal('')),
    clientCompany: z.string().optional(),
    clientPhone: z.string().optional(),
    clientAddress: z.string().optional(),
    calculatorType: z.enum(['marketing', 'custom', 'manual']),
    calculatorData: z.object({}).passthrough(),
    content: z.any().optional(),
    templateId: z.number().optional(),
    theme: z.object({}).passthrough().optional(),
});

const updateProposalSchema = z.object({
    title: z.string().min(1).optional(),
    client_name: z.string().optional(),
    client_email: z.string().email().optional().or(z.literal('')),
    client_company: z.string().optional(),
    client_phone: z.string().optional(),
    client_address: z.string().optional(),
    content: z.any().optional(),
    calculator_data: z.object({}).passthrough().optional(),
    theme: z.object({}).passthrough().optional(),
    status: z.enum(['draft', 'sent', 'viewed', 'accepted', 'rejected']).optional(),
});

// Create proposal
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const data = createProposalSchema.parse(req.body);
        const userId = req.user!.userId;

        const defaultTheme = {
            primaryColor: '#7A1E1E',
            secondaryColor: '#501010',
            fontFamily: 'system-ui',
        };

        const defaultContent = [
            {
                type: 'paragraph',
                content: 'Start writing your proposal here...'
            }
        ];

        const { data: proposal, error } = await supabase
            .from('proposals')
            .insert({
                user_id: userId,
                title: data.title,
                client_name: data.clientName,
                client_company: data.clientCompany || null,
                client_email: data.clientEmail || null,
                client_phone: data.clientPhone || null,
                client_address: data.clientAddress || null,
                calculator_type: data.calculatorType,
                calculator_data: data.calculatorData,
                content: data.content || defaultContent,
                theme: data.theme || defaultTheme,
                status: 'draft',
            })
            .select()
            .single();

        if (error) {
            console.error('Supabase insert error details:', JSON.stringify(error, null, 2));
            throw error;
        }
        if (!proposal) {
            console.error('No proposal returned after insert');
            throw new Error('Failed to create proposal - no data returned');
        }

        res.status(201).json({ proposal });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create proposal error (full):', error);
        res.status(500).json({
            error: 'Failed to create proposal',
            details: error instanceof Error ? error.message : 'Unknown error'
        });
    }
});

// Get all proposals for user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { trashed, page, limit } = req.query;

        // Pagination parameters
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 50;
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('proposals')
            .select(`
                *,
                view_count:proposal_views(count),
                comment_count:proposal_comments(count)
            `, { count: 'exact' })
            .eq('user_id', userId)
            .order('updated_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        // Filter based on trashed status
        // We use the theme->isArchived flag for soft delete since we can't easily alter schema
        if (trashed === 'true') {
            // Show only trashed
            // Note: Supabase JSONB filtering syntax might vary, using containedBy for standard JSONB check
            // or we check if the key exists and is true.
            // .contains('theme', { isArchived: true }) is standard for checking if JSON contains this key-value
            query = query.contains('theme', { isArchived: true });
        } else {
            // Show only non-trashed (default)
            // We want rows where theme does NOT contain { isArchived: true }
            // Supabase .not() with .contains() is the way
            query = query.not('theme', 'cs', '{"isArchived": true}');
        }

        const { data: proposals, error, count } = await query;

        if (error) throw error;

        // Format counts
        const formattedProposals = proposals.map(p => ({
            ...p,
            view_count: p.view_count?.[0]?.count || 0,
            comment_count: p.comment_count?.[0]?.count || 0,
        }));

        res.json({
            proposals: formattedProposals,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limitNum)
            }
        });
    } catch (error) {
        console.error('Get proposals error:', error);
        res.status(500).json({ error: 'Failed to get proposals' });
    }
});

// Get single proposal
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);

        if (isNaN(proposalId)) {
            res.status(400).json({ error: 'Invalid proposal ID' });
            return;
        }

        const userId = req.user!.userId;

        const { data: proposal, error } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (error || !proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        res.json({ proposal });
    } catch (error) {
        console.error('Get proposal error:', error);
        res.status(500).json({ error: 'Failed to get proposal' });
    }
});

// Get specific version of a proposal
router.get('/:id/versions/:versionId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const versionId = parseInt(req.params.versionId);
        const userId = req.user!.userId;

        const { data: proposal, error } = await supabase
            .from('proposals')
            .select('calculator_data, title, client_name')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (error || !proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        // Extract versions from calculator_data
        const versions = proposal.calculator_data?.versions || [];
        const version = versions.find((v: any) => v.id === versionId);

        if (!version) {
            res.status(404).json({ error: 'Version not found' });
            return;
        }

        res.json({
            version,
            proposalTitle: proposal.title,
            clientName: proposal.client_name
        });
    } catch (error) {
        console.error('Get version error:', error);
        res.status(500).json({ error: 'Failed to get version' });
    }
});

// Update proposal
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const userId = req.user!.userId;
        const data = updateProposalSchema.parse(req.body);

        // Verify ownership
        const { data: existing } = await supabase
            .from('proposals')
            .select('id')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (data.title) updates.title = data.title;
        if (data.client_name) updates.client_name = data.client_name;
        if (data.client_email) updates.client_email = data.client_email;
        if (data.client_company) updates.client_company = data.client_company;
        if (data.client_phone) updates.client_phone = data.client_phone;
        if (data.client_address) updates.client_address = data.client_address;
        if (data.content) updates.content = data.content;
        if (data.calculator_data) updates.calculator_data = data.calculator_data;
        if (data.theme) updates.theme = data.theme;
        if (data.status) updates.status = data.status;

        const { data: updated, error } = await supabase
            .from('proposals')
            .update(updates)
            .eq('id', proposalId)
            .select()
            .single();

        if (error) throw error;

        // Send notification for status changes
        if (data.status === 'accepted' || data.status === 'rejected') {
            notifyProposalStatusChange(proposalId, data.status).catch(console.error);
        }

        res.json({ proposal: updated });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Update proposal error:', error);
        res.status(500).json({ error: 'Failed to update proposal' });
    }
});

// Soft delete proposal (Archive) or Hard Delete
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const userId = req.user!.userId;
        const { force } = req.query;

        if (force === 'true') {
            // Hard delete
            const { error } = await supabase
                .from('proposals')
                .delete()
                .eq('id', proposalId)
                .eq('user_id', userId);

            if (error) throw error;
            res.json({ message: 'Proposal permanently deleted' });
            return;
        }

        // Soft delete (Archive)
        // Fetch current theme first to preserve other theme settings
        const { data: current, error: fetchError } = await supabase
            .from('proposals')
            .select('theme')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !current) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const updatedTheme = {
            ...(current.theme as object || {}),
            isArchived: true
        };

        const { error } = await supabase
            .from('proposals')
            .update({ theme: updatedTheme })
            .eq('id', proposalId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Proposal moved to trash' });
    } catch (error) {
        console.error('Delete proposal error:', error);
        res.status(500).json({ error: 'Failed to delete proposal' });
    }
});

// Restore proposal from trash
router.post('/:id/restore', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const userId = req.user!.userId;

        // Fetch current theme
        const { data: current, error: fetchError } = await supabase
            .from('proposals')
            .select('theme')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (fetchError || !current) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const updatedTheme = {
            ...(current.theme as object || {}),
            isArchived: false
        };

        const { error } = await supabase
            .from('proposals')
            .update({ theme: updatedTheme })
            .eq('id', proposalId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Proposal restored' });
    } catch (error) {
        console.error('Restore proposal error:', error);
        res.status(500).json({ error: 'Failed to restore proposal' });
    }
});

// Accept proposal
router.post('/:id/accept', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Share token is required' });
        }

        // Verify token validity
        const { data: link, error: linkError } = await supabase
            .from('proposal_links')
            .select('*')
            .eq('token', token)
            .eq('proposal_id', proposalId)
            .eq('is_active', true)
            .single();

        if (linkError || !link) {
            return res.status(403).json({ error: 'Invalid or expired share token' });
        }

        // Check expiration
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            return res.status(403).json({ error: 'Share link has expired' });
        }

        const { error } = await supabase
            .from('proposals')
            .update({
                status: 'accepted',
                updated_at: new Date().toISOString(),
            })
            .eq('id', proposalId);

        if (error) throw error;

        // Here you would typically trigger a notification and send an email
        // For now, we'll just log it to the console
        console.log(`Proposal ${proposalId} accepted via token ${token}. Triggering notifications.`);

        // Return with suggestion to create contract
        res.json({
            message: 'Proposal accepted',
            suggestContract: true,
            proposalId: proposalId
        });
    } catch (error) {
        console.error('Accept proposal error:', error);
        res.status(500).json({ error: 'Failed to accept proposal' });
    }
});

// Reject proposal
router.post('/:id/reject', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        // const { reason } = req.body; // Reason is not currently stored

        const { error } = await supabase
            .from('proposals')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString(),
            })
            .eq('id', proposalId);

        if (error) throw error;

        res.json({ message: 'Proposal rejected' });
    } catch (error) {
        console.error('Reject proposal error:', error);
        res.status(500).json({ error: 'Failed to reject proposal' });
    }
});

// Add comment
router.post('/:id/comments', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const { author_name, content, highlighted_text, block_id, parent_comment_id } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'content is required' });
        }

        const { data: comment, error } = await supabase
            .from('proposal_comments')
            .insert({
                proposal_id: proposalId,
                author_name: author_name || 'Anonymous',
                content: content,
                highlighted_text: highlighted_text || null,
                block_id: block_id || null,
                parent_comment_id: parent_comment_id || null,
                is_internal: false,
                is_resolved: false
            })
            .select()
            .single();

        if (error) throw error;

        // Send notification to proposal owner
        notifyCommentAdded(proposalId, author_name || 'Anonymous', content).catch(console.error);

        return res.status(201).json({ comment });
    } catch (error) {
        console.error('Add comment error:', error);
        return res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments
router.get('/:id/comments', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const { limit, since } = req.query;

        // Default limit to 100, max 500
        const limitNum = Math.min(parseInt(limit as string) || 100, 500);

        let query = supabase
            .from('proposal_comments')
            .select('*')
            .eq('proposal_id', proposalId)
            .order('created_at', { ascending: true })
            .limit(limitNum);

        // Incremental loading: only fetch comments after a certain timestamp
        if (since) {
            query = query.gt('created_at', since);
        }

        const { data: comments, error } = await query;

        if (error) throw error;

        return res.json({ comments });
    } catch (error) {
        console.error('Get comments error:', error);
        return res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Resolve/unresolve comment
router.patch('/:id/comments/:commentId/resolve', async (req, res) => {
    try {
        const commentId = parseInt(req.params.commentId);
        const { is_resolved } = req.body;

        const { data: comment, error } = await supabase
            .from('proposal_comments')
            .update({ is_resolved: is_resolved ?? true })
            .eq('id', commentId)
            .select()
            .single();

        if (error) throw error;

        return res.json({ comment });
    } catch (error) {
        console.error('Resolve comment error:', error);
        return res.status(500).json({ error: 'Failed to resolve comment' });
    }
});

// Get comments by block ID
router.get('/:id/comments/block/:blockId', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const blockId = req.params.blockId;

        const { data: comments, error } = await supabase
            .from('proposal_comments')
            .select('*')
            .eq('proposal_id', proposalId)
            .eq('block_id', blockId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return res.json({ comments });
    } catch (error: any) {
        console.error('Get block comments error:', error);

        // Check for missing column error (PostgreSQL error code 42703)
        if (error.code === '42703') {
            return res.status(500).json({
                error: 'Database schema issue detected',
                message: 'The block_id column is missing from proposal_comments table. Please run the migration: server/migrations/add_block_level_comments.sql',
                details: error.message
            });
        }

        return res.status(500).json({ error: 'Failed to get block comments' });
    }
});

// Track block change
router.post('/:id/blocks/:blockId/changes', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const blockId = req.params.blockId;
        const { previous_content, new_content, changed_by } = req.body;

        const { data: change, error } = await supabase
            .from('block_changes')
            .insert({
                proposal_id: proposalId,
                block_id: blockId,
                previous_content,
                new_content,
                changed_by: changed_by || req.user?.userId
            })
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({ change });
    } catch (error) {
        console.error('Track block change error:', error);
        return res.status(500).json({ error: 'Failed to track block change' });
    }
});

// Get block change history
router.get('/:id/blocks/:blockId/changes', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const blockId = req.params.blockId;

        const { data: changes, error } = await supabase
            .from('block_changes')
            .select('*')
            .eq('proposal_id', proposalId)
            .eq('block_id', blockId)
            .order('created_at', { ascending: false })
            .limit(50);

        if (error) throw error;

        return res.json({ changes });
    } catch (error) {
        console.error('Get block changes error:', error);
        return res.status(500).json({ error: 'Failed to get block changes' });
    }
});

// Send proposal link via email
router.post('/:id/share-email', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const userId = req.user!.userId;
        const { email, link, message } = req.body;

        if (!email || !link) {
            res.status(400).json({ error: 'Email and link are required' });
            return;
        }

        // Verify ownership
        const { data: proposal } = await supabase
            .from('proposals')
            .select('client_name')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (!proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        await sendProposalLinkEmail({
            to: email,
            clientName: proposal.client_name,
            link,
            message
        });

        res.json({ message: 'Email sent successfully' });
    } catch (error) {
        console.error('Send email error:', error);
        res.status(500).json({ error: 'Failed to send email' });
    }
});

// ===========================================
// VIEWER TRACKING ENDPOINTS
// ===========================================

// Check if viewer exists (for email gate)
router.post('/check-viewer', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const { data: viewer } = await supabase
            .from('proposal_viewers')
            .select('*')
            .eq('email', email.toLowerCase())
            .single();

        if (viewer) {
            return res.json({ exists: true, viewer });
        }

        return res.json({ exists: false });
    } catch (error) {
        console.error('Check viewer error:', error);
        return res.json({ exists: false });
    }
});

// Register or get viewer and create view session
router.post('/:id/register-viewer', async (req, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const { email, name, company } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email is required' });
        }

        const normalizedEmail = email.toLowerCase();

        // Get or create viewer
        let { data: viewer } = await supabase
            .from('proposal_viewers')
            .select('*')
            .eq('proposal_id', proposalId)
            .eq('email', normalizedEmail)
            .single();

        if (!viewer) {
            // Create new viewer
            const { data: newViewer, error: createError } = await supabase
                .from('proposal_viewers')
                .insert({
                    proposal_id: proposalId,
                    email: normalizedEmail,
                    name: name || null,
                    company: company || null,
                })
                .select()
                .single();

            if (createError) throw createError;
            viewer = newViewer;
        } else if (name && !viewer.name) {
            // Update viewer name if missing
            await supabase
                .from('proposal_viewers')
                .update({ name, company: company || viewer.company })
                .eq('id', viewer.id);
            viewer.name = name;
        }

        // Create view session
        const { data: session, error: sessionError } = await supabase
            .from('proposal_view_sessions')
            .insert({
                proposal_id: proposalId,
                viewer_id: viewer.id,
                ip_address: req.ip || req.headers['x-forwarded-for'] || null,
                user_agent: req.headers['user-agent'] || null,
                referrer: req.headers['referer'] || null,
            })
            .select()
            .single();

        if (sessionError) throw sessionError;

        // Update proposal view count (RPC may not exist, ignore errors)
        try {
            await supabase.rpc('increment_view_count', { proposal_id: proposalId });
        } catch {
            // RPC not available, skip
        }

        // Mark as viewed if not already accepted
        await supabase
            .from('proposals')
            .update({ status: 'viewed' })
            .eq('id', proposalId)
            .in('status', ['draft', 'sent']);

        return res.json({
            viewer,
            sessionId: session.id,
        });
    } catch (error) {
        console.error('Register viewer error:', error);
        return res.status(500).json({ error: 'Failed to register viewer' });
    }
});

// Update view session (heartbeat)
router.patch('/view-session/:sessionId', async (req, res) => {
    try {
        const sessionId = parseInt(req.params.sessionId);
        const { duration_seconds, scroll_depth, sections_viewed } = req.body;

        const updates: Record<string, unknown> = {};
        if (duration_seconds) updates.duration_seconds = duration_seconds;
        if (scroll_depth !== undefined) updates.scroll_depth = scroll_depth;
        if (sections_viewed) updates.sections_viewed = sections_viewed;

        const { error } = await supabase
            .from('proposal_view_sessions')
            .update(updates)
            .eq('id', sessionId);

        if (error) throw error;

        return res.json({ success: true });
    } catch (error) {
        console.error('Update view session error:', error);
        return res.status(500).json({ error: 'Failed to update session' });
    }
});

// Get viewer analytics for a proposal (protected)
router.get('/:id/viewers', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const userId = req.user!.userId;

        // Verify ownership
        const { data: proposal } = await supabase
            .from('proposals')
            .select('id')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (!proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Get viewer analytics
        const { data: viewers, error } = await supabase
            .from('proposal_viewers')
            .select(`
                *,
                sessions:proposal_view_sessions(
                    id,
                    viewed_at,
                    duration_seconds,
                    scroll_depth,
                    sections_viewed
                )
            `)
            .eq('proposal_id', proposalId)
            .order('updated_at', { ascending: false });

        if (error) throw error;

        // Format viewer data with analytics
        const formattedViewers = viewers.map(v => {
            const sessions = v.sessions || [];

            // Single-pass aggregation instead of multiple reduces and sorting
            let lastViewedAt = v.created_at;
            let totalTimeSeconds = 0;
            let totalScrollDepth = 0;

            sessions.forEach((s: any) => {
                // Find latest viewed_at
                if (new Date(s.viewed_at) > new Date(lastViewedAt)) {
                    lastViewedAt = s.viewed_at;
                }
                // Sum duration
                totalTimeSeconds += (s.duration_seconds || 0);
                // Sum scroll depth for averaging
                totalScrollDepth += (s.scroll_depth || 0);
            });

            return {
                id: v.id,
                email: v.email,
                name: v.name,
                company: v.company,
                first_viewed_at: v.created_at,
                view_count: sessions.length,
                last_viewed_at: lastViewedAt,
                total_time_seconds: totalTimeSeconds,
                avg_scroll_depth: sessions.length > 0
                    ? Math.round(totalScrollDepth / sessions.length)
                    : 0,
            };
        });

        return res.json({ viewers: formattedViewers });
    } catch (error) {
        console.error('Get viewers error:', error);
        return res.status(500).json({ error: 'Failed to get viewers' });
    }
});

// Create contract from proposal (workflow automation)
router.post('/:id/create-contract', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.id);
        const userId = req.user!.userId;

        // Get the proposal with its data
        const { data: proposal, error: proposalError } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (proposalError || !proposal) {
            return res.status(404).json({ error: 'Proposal not found' });
        }

        // Extract client info and value from calculator_data
        const calcData = proposal.calculator_data as any || {};
        const totals = calcData.totals || {};
        const selectedServices = calcData.selectedServices || [];

        // Build deliverables from selected services
        const deliverables = selectedServices.map((s: any) => ({
            name: s.name || s.service || 'Service',
            description: s.description || '',
            price: s.price || s.monthlyPrice || 0,
            priceType: 'mo'
        }));

        // Generate contract content from proposal
        const contractContent = `
# Service Agreement

This Service Agreement ("Agreement") is entered into between ${proposal.client_name || 'Client'} ("Client") and the service provider ("Provider").

## Scope of Services

The Provider agrees to deliver the following services as outlined in Proposal #${proposal.id}:

${deliverables.map((d: any) => `- **${d.name}**: $${d.price}/mo`).join('\n')}

## Term

This Agreement shall commence upon signature and continue for an initial term of ${calcData.contractTerm || '12 months'}.

## Payment Terms

Total Monthly Value: $${totals.monthlyTotal?.toLocaleString() || '0'}
Payment is due upon receipt of invoice.

## General Terms

Both parties agree to the standard terms and conditions as discussed in the proposal.

---
*Contract generated from Proposal #${proposal.id}*
        `.trim();

        // Create the contract
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .insert({
                user_id: userId,
                proposal_id: proposalId,
                client_id: proposal.client_id,
                title: `Contract - ${proposal.client_name || 'Client'}`,
                client_name: proposal.client_name || '',
                client_email: proposal.client_email || '',
                client_company: proposal.client_company || '',
                content: contractContent,
                deliverables: deliverables,
                total_value: totals.monthlyTotal || 0,
                contract_term: calcData.contractTerm || '12 months',
                status: 'draft'
            })
            .select()
            .single();

        if (contractError || !contract) {
            throw contractError || new Error('Failed to create contract');
        }

        res.status(201).json({ contract });
    } catch (error) {
        console.error('Create contract from proposal error:', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
});

export default router;
