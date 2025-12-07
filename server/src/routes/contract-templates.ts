import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Request schemas
const CreateTemplateSchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    content: z.string().min(1),
    placeholders: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(['text', 'email', 'date', 'currency', 'textarea', 'number']),
    })).optional(),
    category: z.string().optional(),
    is_default: z.boolean().optional(),
});

// List contract templates (user's + public)
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'list-contract-templates', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;

        // Get user's templates and system templates (user_id is null)
        const { data, error } = await supabase
            .from('contract_templates')
            .select('*')
            .or(`user_id.eq.${userId},user_id.is.null`)
            .order('is_default', { ascending: false })
            .order('created_at', { ascending: false });

        if (error) throw error;

        log.info('Contract templates fetched', { count: data?.length || 0 });
        res.json({ templates: data || [] });
    } catch (error) {
        log.error('Failed to fetch contract templates', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get single template
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'get-contract-template', templateId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('contract_templates')
            .select('*')
            .eq('id', id)
            .or(`user_id.eq.${userId},user_id.is.null`)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ error: 'Template not found' });
            return;
        }

        res.json(data);
    } catch (error) {
        log.error('Failed to fetch template', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// Create template
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-contract-template', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const input = CreateTemplateSchema.parse(req.body);

        const { data, error } = await supabase
            .from('contract_templates')
            .insert({
                user_id: userId,
                name: input.name,
                description: input.description,
                content: input.content,
                placeholders: input.placeholders || [],
                category: input.category,
                is_default: input.is_default || false,
            })
            .select()
            .single();

        if (error) throw error;

        log.info('Contract template created', { templateId: data.id });
        res.json(data);
    } catch (error) {
        log.error('Failed to create template', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'update-contract-template', templateId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const updates = req.body;

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('contract_templates')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId) // Only allow editing own templates
            .select()
            .single();

        if (error) throw error;

        log.info('Contract template updated', { templateId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to update template', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'delete-contract-template', templateId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { error } = await supabase
            .from('contract_templates')
            .delete()
            .eq('id', id)
            .eq('user_id', userId); // Only allow deleting own templates

        if (error) throw error;

        log.info('Contract template deleted', { templateId: id });
        res.json({ success: true });
    } catch (error) {
        log.error('Failed to delete template', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

export default router;
