import { Router } from 'express';
import { z } from 'zod';
import supabase from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const createTemplateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    contentBlocks: z.object({}).passthrough(), // BlockNote JSON structure
    theme: z.object({}).passthrough().optional(),
    category: z.string().optional(),
    thumbnailUrl: z.string().optional(),
    isPublic: z.boolean().optional(),
});

// Create template
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const data = createTemplateSchema.parse(req.body);
        const userId = req.user!.userId;

        const { data: template, error } = await supabase
            .from('templates')
            .insert({
                user_id: userId,
                name: data.name,
                description: data.description || null,
                content_blocks: data.contentBlocks,
                theme: data.theme || null,
                category: data.category || null,
                thumbnail_url: data.thumbnailUrl || null,
                is_public: data.isPublic || false,
            })
            .select()
            .single();

        if (error || !template) throw error || new Error('Failed to create template');

        res.status(201).json({ template });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Create template error:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Get all templates (user's + public)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;

        const { data: templates, error } = await supabase
            .from('templates')
            .select('*')
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.json({ templates });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({ error: 'Failed to get templates' });
    }
});

// Get single template
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const templateId = req.params.id; // UUID now
        const userId = req.user!.userId;

        const { data: template, error } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .single();

        if (error || !template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json({ template });
    } catch (error) {
        console.error('Get template error:', error);
        res.status(500).json({ error: 'Failed to get template' });
    }
});

// Duplicate template to create new proposal
router.post('/:id/duplicate', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const templateId = req.params.id;
        const userId = req.user!.userId;
        const { clientName, clientEmail, clientCompany } = req.body;

        // Get template
        const { data: template, error: templateError } = await supabase
            .from('templates')
            .select('*')
            .eq('id', templateId)
            .or(`user_id.eq.${userId},is_public.eq.true`)
            .single();

        if (templateError || !template) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        // Create new proposal from template
        const { data: proposal, error: proposalError } = await supabase
            .from('proposals')
            .insert({
                user_id: userId,
                title: `${template.name} - ${clientName || 'New Proposal'}`,
                client_name: clientName || 'New Client',
                client_email: clientEmail || null,
                client_company: clientCompany || null,
                calculator_type: 'custom', // Templates create custom proposals
                calculator_data: {}, // Empty calculator data initially
                content: template.content_blocks, // Copy template content
                theme: template.theme,
                status: 'draft',
            })
            .select()
            .single();

        if (proposalError || !proposal) throw proposalError || new Error('Failed to create proposal');

        res.status(201).json({ proposal });
    } catch (error) {
        console.error('Duplicate template error:', error);
        res.status(500).json({ error: 'Failed to duplicate template' });
    }
});

// Update template
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const templateId = req.params.id;
        const userId = req.user!.userId;
        const { name, description, contentBlocks, theme, category, thumbnailUrl, isPublic } = req.body;

        // Verify ownership
        const { data: existing } = await supabase
            .from('templates')
            .select('id')
            .eq('id', templateId)
            .eq('user_id', userId)
            .single();

        if (!existing) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        const updates: any = {
            updated_at: new Date().toISOString(),
        };

        if (name) updates.name = name;
        if (description !== undefined) updates.description = description;
        if (contentBlocks) updates.content_blocks = contentBlocks;
        if (theme) updates.theme = theme;
        if (category !== undefined) updates.category = category;
        if (thumbnailUrl !== undefined) updates.thumbnail_url = thumbnailUrl;
        if (typeof isPublic === 'boolean') updates.is_public = isPublic;

        const { data: updated, error } = await supabase
            .from('templates')
            .update(updates)
            .eq('id', templateId)
            .select()
            .single();

        if (error) throw error;

        res.json({ template: updated });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const templateId = req.params.id;
        const userId = req.user!.userId;

        const { error } = await supabase
            .from('templates')
            .delete()
            .eq('id', templateId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ message: 'Template deleted successfully' });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
