import { Router } from 'express';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import bcrypt from 'bcryptjs';
import supabase from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createLinkSchema = z.object({
    password: z.string().optional(),
    expiresAt: z.string().datetime().optional(),
    maxViews: z.number().positive().optional(),
});

// Create shareable link
router.post('/:proposalId/links', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.proposalId);
        const userId = req.user!.userId;
        const data = createLinkSchema.parse(req.body);

        // Verify ownership
        const { data: proposal, error: propError } = await supabase
            .from('proposals')
            .select('id')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (!proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const token = nanoid(16);
        const passwordHash = data.password ? await bcrypt.hash(data.password, 10) : null;

        const { data: link, error } = await supabase
            .from('proposal_links')
            .insert({
                proposal_id: proposalId,
                token,
                password_hash: passwordHash,
                expires_at: data.expiresAt || null,
                max_views: data.maxViews || null,
            })
            .select()
            .single();

        if (error || !link) throw error || new Error('Failed to create link');

        // Update proposal status to 'sent' if it's still draft
        await supabase
            .from('proposals')
            .update({
                status: 'sent',
                updated_at: new Date().toISOString(),
            })
            .eq('id', proposalId)
            .eq('status', 'draft');

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
        const shareUrl = `${frontendUrl}/p/${token}`;

        res.status(201).json({
            link: {
                ...link,
                url: shareUrl,
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create link error:', error);
        res.status(500).json({ error: 'Failed to create link' });
    }
});

// Get all links for a proposal
router.get('/:proposalId/links', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const proposalId = parseInt(req.params.proposalId);
        const userId = req.user!.userId;

        // Verify ownership
        const { data: proposal } = await supabase
            .from('proposals')
            .select('id')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (!proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        const { data: links, error } = await supabase
            .from('proposal_links')
            .select('*')
            .eq('proposal_id', proposalId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        const linksWithUrls = links.map(link => ({
            ...link,
            url: `${frontendUrl}/p/${link.token}`,
            hasPassword: !!link.password_hash,
            password_hash: undefined, // Don't send hash to client
        }));

        res.json({ links: linksWithUrls });
    } catch (error) {
        console.error('Get links error:', error);
        res.status(500).json({ error: 'Failed to get links' });
    }
});

// Update link
router.put('/:linkId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const linkId = parseInt(req.params.linkId);
        const userId = req.user!.userId;
        const { isActive, expiresAt, maxViews } = req.body;

        // Verify ownership through proposal
        // Note: Supabase join syntax is a bit different, doing two queries for simplicity or using RLS policies would be better in real app
        // But here we simulate the previous SQL join logic
        const { data: link } = await supabase
            .from('proposal_links')
            .select('*, proposals!inner(user_id)')
            .eq('id', linkId)
            .eq('proposals.user_id', userId)
            .single();

        if (!link) {
            res.status(404).json({ error: 'Link not found' });
            return;
        }

        const updates: any = {};
        if (typeof isActive === 'boolean') updates.is_active = isActive;
        if (expiresAt !== undefined) updates.expires_at = expiresAt;
        if (maxViews !== undefined) updates.max_views = maxViews;

        if (Object.keys(updates).length === 0) {
            res.status(400).json({ error: 'No updates provided' });
            return;
        }

        const { data: updated, error } = await supabase
            .from('proposal_links')
            .update(updates)
            .eq('id', linkId)
            .select()
            .single();

        if (error) throw error;

        res.json({
            link: {
                ...updated,
                hasPassword: !!updated.password_hash,
                password_hash: undefined,
            },
        });
    } catch (error) {
        console.error('Update link error:', error);
        res.status(500).json({ error: 'Failed to update link' });
    }
});

// Revoke link
router.delete('/:linkId', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const linkId = parseInt(req.params.linkId);
        const userId = req.user!.userId;

        // Verify ownership and deactivate
        // Using the same join logic as update
        const { data: link } = await supabase
            .from('proposal_links')
            .select('*, proposals!inner(user_id)')
            .eq('id', linkId)
            .eq('proposals.user_id', userId)
            .single();

        if (!link) {
            res.status(404).json({ error: 'Link not found' });
            return;
        }

        const { error } = await supabase
            .from('proposal_links')
            .update({ is_active: false })
            .eq('id', linkId);

        if (error) throw error;

        res.json({ message: 'Link revoked successfully' });
    } catch (error) {
        console.error('Revoke link error:', error);
        res.status(500).json({ error: 'Failed to revoke link' });
    }
});

// Access proposal via shared link (public)
router.get('/share/:token', async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.query;

        const { data: link, error } = await supabase
            .from('proposal_links')
            .select('*')
            .eq('token', token)
            .eq('is_active', true)
            .single();

        if (error || !link) {
            res.status(404).json({ error: 'Link not found or expired' });
            return;
        }

        // Check expiration
        if (link.expires_at && new Date(link.expires_at) < new Date()) {
            res.status(410).json({ error: 'Link has expired' });
            return;
        }

        // Check max views
        if (link.max_views && link.view_count >= link.max_views) {
            res.status(410).json({ error: 'Link has reached maximum views' });
            return;
        }

        // Check password
        if (link.password_hash) {
            if (!password) {
                res.status(401).json({ error: 'Password required', requiresPassword: true });
                return;
            }

            const isValid = await bcrypt.compare(password as string, link.password_hash);
            if (!isValid) {
                res.status(401).json({ error: 'Invalid password' });
                return;
            }
        }

        // Get proposal
        const { data: proposal } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', link.proposal_id)
            .single();

        if (!proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        // Update view count
        await supabase.rpc('increment_view_count', { link_id: link.id });
        // Alternatively if RPC not set up:
        // await supabase.from('proposal_links').update({ view_count: link.view_count + 1 }).eq('id', link.id);
        // But let's stick to simple update for now to avoid needing extra SQL functions
        await supabase
            .from('proposal_links')
            .update({ view_count: link.view_count + 1 })
            .eq('id', link.id);


        // Update proposal status to 'viewed' if it's 'sent'
        if (proposal.status === 'sent') {
            await supabase
                .from('proposals')
                .update({
                    status: 'viewed',
                    updated_at: new Date().toISOString(),
                })
                .eq('id', proposal.id);
        }

        res.json({
            proposal,
            linkId: link.id,
        });
    } catch (error) {
        console.error('Access link error:', error);
        res.status(500).json({ error: 'Failed to access proposal' });
    }
});

export default router;
