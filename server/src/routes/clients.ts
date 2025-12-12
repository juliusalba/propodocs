import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Validation schemas
const CreateClientSchema = z.object({
    name: z.string().min(1, 'Name is required').max(200),
    email: z.string().email().optional().or(z.literal('')),
    company: z.string().max(200).optional(),
    phone: z.string().max(50).optional(),
    address: z.string().optional(),
    notes: z.string().optional(),
    tags: z.array(z.string()).optional(),
    status: z.enum(['active', 'inactive', 'archived']).optional(),
});

const UpdateClientSchema = CreateClientSchema.partial();

// List all clients for user
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'list-clients', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const { status, search } = req.query;

        let query = supabase
            .from('clients')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }

        if (search) {
            query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
        }

        const { data, error } = await query;

        if (error) {
            log.error('Failed to fetch clients', { error });
            throw error;
        }

        res.json({ clients: data || [] });
    } catch (error) {
        log.error('Failed to fetch clients', error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// Get single client with related entities
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'get-client', clientId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !data) {
            res.status(404).json({ error: 'Client not found' });
            return;
        }

        // Get related proposals, invoices, contracts
        const [proposalsResult, invoicesResult, contractsResult] = await Promise.all([
            supabase
                .from('proposals')
                .select('id, title, status, created_at, calculator_data')
                .eq('client_id', id)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('invoices')
                .select('id, invoice_number, total, status, created_at')
                .eq('client_id', id)
                .order('created_at', { ascending: false })
                .limit(10),
            supabase
                .from('contracts')
                .select('id, title, status, created_at')
                .eq('client_id', id)
                .order('created_at', { ascending: false })
                .limit(10),
        ]);

        res.json({
            client: data,
            proposals: proposalsResult.data || [],
            invoices: invoicesResult.data || [],
            contracts: contractsResult.data || [],
        });
    } catch (error) {
        log.error('Failed to fetch client', error);
        res.status(500).json({ error: 'Failed to fetch client' });
    }
});

// Create client
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-client', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const input = CreateClientSchema.parse(req.body);

        const { data, error } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                name: input.name,
                email: input.email || null,
                company: input.company || null,
                phone: input.phone || null,
                address: input.address || null,
                notes: input.notes || null,
                tags: input.tags || [],
                status: input.status || 'active',
            })
            .select()
            .single();

        if (error) {
            log.error('Supabase error creating client', { error });
            throw error;
        }

        log.info('Client created successfully', { clientId: data.id });
        res.status(201).json(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Validation failed', details: error.errors });
            return;
        }
        log.error('Failed to create client', error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// Update client
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'update-client', clientId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const input = UpdateClientSchema.parse(req.body);

        const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
        };

        if (input.name !== undefined) updates.name = input.name;
        if (input.email !== undefined) updates.email = input.email || null;
        if (input.company !== undefined) updates.company = input.company || null;
        if (input.phone !== undefined) updates.phone = input.phone || null;
        if (input.address !== undefined) updates.address = input.address || null;
        if (input.notes !== undefined) updates.notes = input.notes || null;
        if (input.tags !== undefined) updates.tags = input.tags;
        if (input.status !== undefined) updates.status = input.status;

        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        log.info('Client updated', { clientId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to update client', error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// Delete client
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'delete-client', clientId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { error } = await supabase
            .from('clients')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        log.info('Client deleted', { clientId: id });
        res.json({ success: true });
    } catch (error) {
        log.error('Failed to delete client', error);
        res.status(500).json({ error: 'Failed to delete client' });
    }
});

// Get or create client by email (for proposal/invoice creation)
router.post('/find-or-create', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'find-or-create-client' });

    try {
        const userId = req.user!.userId;
        const { name, email, company, phone, address } = req.body;

        if (!name) {
            res.status(400).json({ error: 'Name is required' });
            return;
        }

        // Try to find existing client by email first
        if (email) {
            const { data: existing } = await supabase
                .from('clients')
                .select('*')
                .eq('user_id', userId)
                .eq('email', email)
                .single();

            if (existing) {
                // Update with any new info
                const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
                if (company && !existing.company) updates.company = company;
                if (phone && !existing.phone) updates.phone = phone;
                if (address && !existing.address) updates.address = address;

                if (Object.keys(updates).length > 1) {
                    await supabase.from('clients').update(updates).eq('id', existing.id);
                }

                res.json({ client: existing, created: false });
                return;
            }
        }

        // Create new client
        const { data: newClient, error } = await supabase
            .from('clients')
            .insert({
                user_id: userId,
                name,
                email: email || null,
                company: company || null,
                phone: phone || null,
                address: address || null,
                status: 'active',
            })
            .select()
            .single();

        if (error) throw error;

        log.info('Client created via find-or-create', { clientId: newClient.id });
        res.json({ client: newClient, created: true });
    } catch (error) {
        log.error('Failed to find/create client', error);
        res.status(500).json({ error: 'Failed to find or create client' });
    }
});

// Update client stats (called after proposal/invoice/contract operations)
router.post('/:id/refresh-stats', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'refresh-client-stats', clientId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        // Count related entities
        const [proposalCount, invoiceCount, contractCount, revenueResult] = await Promise.all([
            supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('client_id', id),
            supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('client_id', id),
            supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('client_id', id),
            supabase.from('invoices').select('total').eq('client_id', id).eq('status', 'paid'),
        ]);

        const totalRevenue = (revenueResult.data || []).reduce((sum, inv) => sum + (inv.total || 0), 0);

        const { error } = await supabase
            .from('clients')
            .update({
                proposal_count: proposalCount.count || 0,
                invoice_count: invoiceCount.count || 0,
                contract_count: contractCount.count || 0,
                total_revenue: totalRevenue,
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error) {
        log.error('Failed to refresh client stats', error);
        res.status(500).json({ error: 'Failed to refresh stats' });
    }
});

export default router;
