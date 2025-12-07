import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import crypto from 'crypto';

const router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Generate access token for client viewing
function generateAccessToken(): string {
    return crypto.randomBytes(32).toString('hex');
}

// Replace placeholders in template content
function fillPlaceholders(content: string, values: Record<string, string>): string {
    let result = content;
    for (const [key, value] of Object.entries(values)) {
        const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
        result = result.replace(regex, value || '');
    }
    return result;
}

// Request schemas
const CreateContractSchema = z.object({
    proposal_id: z.number().optional(),
    template_id: z.number().optional(),
    client_name: z.string().min(1),
    client_company: z.string().optional(),
    client_email: z.string().email().optional(),
    client_address: z.string().optional(),
    title: z.string().min(1),
    content: z.string().min(1),
    deliverables: z.array(z.object({
        name: z.string(),
        description: z.string().optional(),
        price: z.number().optional(),
        priceType: z.string().optional(),
    })).optional(),
    total_value: z.number().optional(),
    contract_term: z.string().optional(),
    expires_at: z.string().optional(),
});

const SignContractSchema = z.object({
    signer_name: z.string().min(1),
    signer_email: z.string().email().optional(),
    signature_data: z.string().min(1), // Base64 PNG
});

// List contracts
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'list-contracts', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const { status, proposalId } = req.query;

        let query = supabase
            .from('contracts')
            .select('*, contract_signatures(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (proposalId) {
            query = query.eq('proposal_id', parseInt(proposalId as string));
        }

        const { data, error } = await query;

        if (error) throw error;

        log.info('Contracts fetched', { count: data?.length || 0 });
        res.json({ contracts: data || [] });
    } catch (error) {
        log.error('Failed to fetch contracts', error);
        res.status(500).json({ error: 'Failed to fetch contracts' });
    }
});

// Get single contract (authenticated user)
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'get-contract', contractId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('contracts')
            .select('*, contract_signatures(*), contract_templates(*)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        res.json(data);
    } catch (error) {
        log.error('Failed to fetch contract', error);
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
});

// Get contract by access token (public - for client signing)
router.get('/view/:token', async (req, res) => {
    const log = logger.child({ action: 'view-contract-by-token' });

    try {
        const { token } = req.params;

        const { data, error } = await supabase
            .from('contracts')
            .select('id, title, content, client_name, client_company, deliverables, total_value, contract_term, status, client_signed_at, expires_at')
            .eq('access_token', token)
            .single();

        if (error || !data) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        // Check if expired
        if (data.expires_at && new Date(data.expires_at) < new Date()) {
            res.status(410).json({ error: 'Contract has expired' });
            return;
        }

        // Update to viewed if not already signed
        if (data.status === 'sent') {
            await supabase
                .from('contracts')
                .update({ status: 'viewed' })
                .eq('access_token', token);
        }

        res.json(data);
    } catch (error) {
        log.error('Failed to fetch contract by token', error);
        res.status(500).json({ error: 'Failed to fetch contract' });
    }
});

// Create contract
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-contract', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const input = CreateContractSchema.parse(req.body);

        const accessToken = generateAccessToken();

        const { data, error } = await supabase
            .from('contracts')
            .insert({
                user_id: userId,
                proposal_id: input.proposal_id,
                template_id: input.template_id,
                client_name: input.client_name,
                client_company: input.client_company,
                client_email: input.client_email,
                client_address: input.client_address,
                title: input.title,
                content: input.content,
                deliverables: input.deliverables || [],
                total_value: input.total_value,
                contract_term: input.contract_term,
                access_token: accessToken,
                expires_at: input.expires_at,
                status: 'draft',
            })
            .select()
            .single();

        if (error) throw error;

        log.info('Contract created', { contractId: data.id });
        res.json(data);
    } catch (error) {
        log.error('Failed to create contract', error);
        res.status(500).json({ error: 'Failed to create contract' });
    }
});

// Update contract
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'update-contract', contractId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const updates = req.body;

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('contracts')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        log.info('Contract updated', { contractId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to update contract', error);
        res.status(500).json({ error: 'Failed to update contract' });
    }
});

// Delete contract
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'delete-contract', contractId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { error } = await supabase
            .from('contracts')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        log.info('Contract deleted', { contractId: id });
        res.json({ success: true });
    } catch (error) {
        log.error('Failed to delete contract', error);
        res.status(500).json({ error: 'Failed to delete contract' });
    }
});

// Send contract
router.post('/:id/send', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'send-contract', contractId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        // Get contract data first
        const { data: contract, error: fetchError } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !contract) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        // Update status to sent
        const { data, error } = await supabase
            .from('contracts')
            .update({
                status: 'sent',
                sent_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        // Send email to client
        if (contract.client_email) {
            try {
                const { sendContractEmail } = await import('../utils/email.js');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

                await sendContractEmail({
                    to: contract.client_email,
                    clientName: contract.client_name,
                    contractTitle: contract.title,
                    totalValue: contract.total_value,
                    signingLink: `${frontendUrl}/c/${contract.access_token}`,
                });
                log.info('Contract email sent', { to: contract.client_email });
            } catch (emailError) {
                log.error('Failed to send contract email', emailError);
                // Don't fail the whole request if email fails
            }
        }

        log.info('Contract sent', { contractId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to send contract', error);
        res.status(500).json({ error: 'Failed to send contract' });
    }
});

// Client signs contract (public endpoint, requires access token)
router.post('/sign/:token', async (req, res) => {
    const log = logger.child({ action: 'sign-contract' });

    try {
        const { token } = req.params;
        const input = SignContractSchema.parse(req.body);

        // Get contract
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .select('*')
            .eq('access_token', token)
            .single();

        if (contractError || !contract) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        if (contract.client_signed_at) {
            res.status(400).json({ error: 'Contract already signed' });
            return;
        }

        if (contract.expires_at && new Date(contract.expires_at) < new Date()) {
            res.status(410).json({ error: 'Contract has expired' });
            return;
        }

        // Create signature record
        const { error: signatureError } = await supabase
            .from('contract_signatures')
            .insert({
                contract_id: contract.id,
                signer_type: 'client',
                signer_name: input.signer_name,
                signer_email: input.signer_email,
                signature_data: input.signature_data,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

        if (signatureError) throw signatureError;

        // Update contract status
        const { data, error } = await supabase
            .from('contracts')
            .update({
                status: 'signed',
                client_signed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', contract.id)
            .select()
            .single();

        if (error) throw error;

        // TODO: Send notification to contract owner

        log.info('Contract signed by client', { contractId: contract.id });
        res.json({ success: true, contract: data });
    } catch (error) {
        log.error('Failed to sign contract', error);
        res.status(500).json({ error: 'Failed to sign contract' });
    }
});

// User counter-signs contract
router.post('/:id/countersign', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'countersign-contract', contractId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const { signature_data } = req.body;

        // Get contract
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (contractError || !contract) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        if (!contract.client_signed_at) {
            res.status(400).json({ error: 'Client must sign first' });
            return;
        }

        // Get user for signer name
        const { data: user } = await supabase
            .from('users')
            .select('name, email')
            .eq('id', userId)
            .single();

        // Create signature record
        const { error: signatureError } = await supabase
            .from('contract_signatures')
            .insert({
                contract_id: contract.id,
                signer_type: 'user',
                signer_name: user?.name || 'Provider',
                signer_email: user?.email,
                signature_data,
                ip_address: req.ip,
                user_agent: req.headers['user-agent'],
            });

        if (signatureError) throw signatureError;

        // Update contract status
        const { data, error } = await supabase
            .from('contracts')
            .update({
                status: 'completed',
                user_signed_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        log.info('Contract countersigned', { contractId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to countersign contract', error);
        res.status(500).json({ error: 'Failed to countersign contract' });
    }
});

// Generate contract from proposal
router.post('/from-proposal/:proposalId', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'generate-contract-from-proposal', proposalId: req.params.proposalId });

    try {
        const userId = req.user!.userId;
        const { proposalId } = req.params;
        const { templateId } = req.body;

        // Fetch proposal
        const { data: proposal, error: proposalError } = await supabase
            .from('proposals')
            .select('*')
            .eq('id', proposalId)
            .eq('user_id', userId)
            .single();

        if (proposalError || !proposal) {
            res.status(404).json({ error: 'Proposal not found' });
            return;
        }

        // Fetch template (or default)
        let template;
        if (templateId) {
            const { data } = await supabase
                .from('contract_templates')
                .select('*')
                .eq('id', templateId)
                .single();
            template = data;
        } else {
            const { data } = await supabase
                .from('contract_templates')
                .select('*')
                .eq('is_default', true)
                .single();
            template = data;
        }

        if (!template) {
            res.status(404).json({ error: 'No contract template found' });
            return;
        }

        // Fetch user for company details
        const { data: user } = await supabase
            .from('users')
            .select('name, email, company')
            .eq('id', userId)
            .single();

        // Extract data from calculator_data
        const calcData = proposal.calculator_data as any;
        const deliverables: any[] = [];
        let monthlyAmount = 0;
        let setupFee = 0;

        if (calcData.selectedTier) {
            deliverables.push({
                name: calcData.selectedTier.name,
                description: calcData.selectedTier.description,
                price: calcData.selectedTier.monthlyPrice,
                priceType: 'monthly',
            });
            monthlyAmount = calcData.selectedTier.monthlyPrice || 0;
            setupFee = calcData.selectedTier.setupFee || 0;
        }

        if (calcData.addOnStates) {
            for (const [, addon] of Object.entries(calcData.addOnStates as Record<string, any>)) {
                if (addon.selected) {
                    deliverables.push({
                        name: addon.name,
                        description: addon.description,
                        price: addon.price,
                        priceType: addon.priceType || 'monthly',
                    });
                }
            }
        }

        // Format deliverables as text
        const deliverablesText = deliverables
            .map((d, i) => `${i + 1}. **${d.name}**: ${d.description || ''} - $${d.price?.toLocaleString() || 0}/${d.priceType}`)
            .join('\n');

        const contractTerm = calcData.contractTerm || '12 months';
        const totalValue = (monthlyAmount * 12) + setupFee;

        // Fill placeholders
        const placeholderValues: Record<string, string> = {
            effective_date: new Date().toLocaleDateString(),
            company_name: user?.company || 'Your Company',
            company_address: '',
            company_email: user?.email || '',
            client_name: proposal.client_name,
            client_company: proposal.client_company || '',
            client_address: '',
            client_email: proposal.client_email || '',
            deliverables: deliverablesText,
            contract_term: contractTerm,
            monthly_amount: `$${monthlyAmount.toLocaleString()}`,
            setup_fee: `$${setupFee.toLocaleString()}`,
            total_value: `$${totalValue.toLocaleString()}`,
            milestones: 'As per agreed deliverables schedule',
            governing_state: 'California',
            provider_name: user?.name || '',
            client_signer_name: proposal.client_name,
        };

        const filledContent = fillPlaceholders(template.content, placeholderValues);
        const accessToken = generateAccessToken();

        // Create contract
        const { data, error } = await supabase
            .from('contracts')
            .insert({
                user_id: userId,
                proposal_id: parseInt(proposalId),
                template_id: template.id,
                client_name: proposal.client_name,
                client_company: proposal.client_company,
                client_email: proposal.client_email,
                title: `${proposal.title} - Service Agreement`,
                content: filledContent,
                deliverables,
                total_value: totalValue,
                contract_term: contractTerm,
                access_token: accessToken,
                status: 'draft',
            })
            .select()
            .single();

        if (error) throw error;

        log.info('Contract generated from proposal', { proposalId, contractId: data.id });
        res.json(data);
    } catch (error) {
        log.error('Failed to generate contract from proposal', error);
        res.status(500).json({ error: 'Failed to generate contract' });
    }
});

export default router;
