import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';
import { logger } from '../utils/logger.js';
import { standardRateLimiter } from '../middleware/rateLimiter.js';
import { sanitizeContractData } from '../utils/sanitize.js';
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
    client_name: z.string().min(1, 'Client name is required').max(200),
    client_company: z.string().max(200).optional(),
    client_email: z.string().email('Invalid email format').max(254).optional().or(z.literal('')),
    client_address: z.string().max(500).optional(),
    title: z.string().min(1, 'Contract title is required').max(300),
    content: z.string().min(1, 'Contract content is required').max(100000),
    deliverables: z.array(z.object({
        name: z.string().min(1).max(200),
        description: z.string().max(1000).optional(),
        price: z.number().min(0).max(10000000).optional(),
        priceType: z.string().max(50).optional(),
    })).optional(),
    total_value: z.number().min(0).max(10000000).optional(),
    contract_term: z.string().max(100).optional(),
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
        const { status, proposalId, page, limit } = req.query;

        // Pagination parameters
        const pageNum = parseInt(page as string) || 1;
        const limitNum = parseInt(limit as string) || 50;
        const offset = (pageNum - 1) * limitNum;

        let query = supabase
            .from('contracts')
            .select('*, contract_signatures(*)', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limitNum - 1);

        if (status && status !== 'all') {
            query = query.eq('status', status);
        }
        if (proposalId) {
            query = query.eq('proposal_id', parseInt(proposalId as string));
        }

        const { data, error, count } = await query;

        if (error) throw error;

        log.info('Contracts fetched', { count: data?.length || 0, total: count });
        res.json({
            contracts: data || [],
            pagination: {
                page: pageNum,
                limit: limitNum,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limitNum)
            }
        });
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

// Create contract - with rate limiting and sanitization
router.post('/', authMiddleware, standardRateLimiter, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-contract', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;

        // Sanitize input data first
        const sanitizedData = sanitizeContractData(req.body);

        // Log incoming request (sanitized)
        log.info('Creating contract', {
            title: sanitizedData.title,
            client_name: sanitizedData.client_name,
            has_content: !!sanitizedData.content
        });

        // Validate with Zod
        const input = CreateContractSchema.parse(sanitizedData);

        const accessToken = generateAccessToken();

        const { data, error } = await supabase
            .from('contracts')
            .insert({
                user_id: userId,
                proposal_id: input.proposal_id,
                template_id: input.template_id,
                client_name: input.client_name,
                client_company: input.client_company,
                client_email: input.client_email || null,
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

        if (error) {
            log.error('Supabase error creating contract', { error, code: error.code, message: error.message });
            throw error;
        }

        log.info('Contract created successfully', { contractId: data.id });
        res.json(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            log.error('Validation error creating contract', { errors: error.errors });
            res.status(400).json({
                error: 'Validation failed',
                details: error.errors.map(e => ({
                    field: e.path.join('.'),
                    message: e.message
                }))
            });
            return;
        }

        log.error('Failed to create contract', {
            error,
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
        });

        const errorMessage = error instanceof Error ? error.message : 'Failed to create contract';
        res.status(500).json({ error: errorMessage });
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

// Generate Contract PDF
router.post('/:id/pdf', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'generate-contract-pdf', contractId: req.params.id });
    let browser;

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        // Fetch contract
        const { data: contract, error } = await supabase
            .from('contracts')
            .select('*, contract_signatures(*)')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !contract) {
            res.status(404).json({ error: 'Contract not found' });
            return;
        }

        // Generate deliverables HTML
        const deliverablesHTML = (contract.deliverables || []).map((d: any, i: number) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${i + 1}. ${d.name}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${d.description || '-'}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${(d.price || 0).toLocaleString()}${d.priceType === 'monthly' ? '/mo' : ''}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: Georgia, 'Times New Roman', serif; color: #1f2937; line-height: 1.8; padding: 50px; }
                    .header { text-align: center; margin-bottom: 40px; padding-bottom: 30px; border-bottom: 2px solid #7A1E1E; }
                    .logo { font-size: 24px; font-weight: 400; letter-spacing: 3px; color: #7A1E1E; text-transform: uppercase; }
                    .title { font-size: 28px; font-weight: 700; color: #1f2937; margin-top: 20px; }
                    .parties { display: flex; gap: 40px; margin: 30px 0; padding: 20px; background: #f9fafb; border-radius: 8px; }
                    .party { flex: 1; }
                    .party-label { font-size: 12px; text-transform: uppercase; color: #7A1E1E; margin-bottom: 8px; font-weight: 600; letter-spacing: 1px; }
                    .party-name { font-weight: 700; color: #1f2937; font-size: 16px; }
                    .party-details { color: #6b7280; font-size: 14px; }
                    .section { margin: 30px 0; }
                    .section-title { font-size: 18px; font-weight: 700; color: #7A1E1E; margin-bottom: 15px; border-bottom: 1px solid #e5e7eb; padding-bottom: 8px; }
                    .content { font-size: 14px; color: #374151; white-space: pre-wrap; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th { text-align: left; padding: 12px; background: #7A1E1E; color: white; font-size: 12px; text-transform: uppercase; }
                    .signature-section { margin-top: 60px; display: flex; gap: 60px; }
                    .signature-block { flex: 1; }
                    .signature-line { border-bottom: 1px solid #1f2937; height: 60px; margin-bottom: 8px; }
                    .signature-label { font-size: 12px; color: #6b7280; }
                    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
                    .status-signed { background: #d1fae5; color: #059669; }
                    .status-sent { background: #fef3c7; color: #d97706; }
                    .status-draft { background: #e5e7eb; color: #6b7280; }
                    .value-box { background: #7A1E1E; color: white; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                    .value-label { font-size: 12px; opacity: 0.8; text-transform: uppercase; letter-spacing: 1px; }
                    .value-amount { font-size: 32px; font-weight: 700; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="logo">Propodocs</div>
                    <div class="title">${contract.title}</div>
                    <div style="margin-top: 10px;"><span class="status status-${contract.status}">${contract.status.toUpperCase()}</span></div>
                </div>
                
                <div class="parties">
                    <div class="party">
                        <div class="party-label">Service Provider</div>
                        <div class="party-name">Propodocs</div>
                        <div class="party-details">Proposal Management Platform</div>
                    </div>
                    <div class="party">
                        <div class="party-label">Client</div>
                        <div class="party-name">${contract.client_name}</div>
                        ${contract.client_company ? `<div class="party-details">${contract.client_company}</div>` : ''}
                        ${contract.client_email ? `<div class="party-details">${contract.client_email}</div>` : ''}
                    </div>
                </div>

                ${contract.total_value ? `
                <div class="value-box">
                    <div class="value-label">Total Contract Value</div>
                    <div class="value-amount">$${contract.total_value.toLocaleString()}</div>
                    ${contract.contract_term ? `<div style="font-size: 14px; opacity: 0.9; margin-top: 8px;">Term: ${contract.contract_term}</div>` : ''}
                </div>
                ` : ''}

                ${deliverablesHTML ? `
                <div class="section">
                    <div class="section-title">Deliverables</div>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th>Description</th>
                                <th style="text-align: right;">Price</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${deliverablesHTML}
                        </tbody>
                    </table>
                </div>
                ` : ''}

                <div class="section">
                    <div class="section-title">Terms & Conditions</div>
                    <div class="content">${contract.content}</div>
                </div>

                <div class="signature-section">
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-label">Client Signature</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">${contract.client_name}</div>
                        ${contract.client_signed_at ? `<div style="font-size: 11px; color: #059669;">Signed: ${new Date(contract.client_signed_at).toLocaleString()}</div>` : ''}
                    </div>
                    <div class="signature-block">
                        <div class="signature-line"></div>
                        <div class="signature-label">Provider Signature</div>
                        <div style="font-size: 12px; color: #6b7280; margin-top: 4px;">Propodocs</div>
                        ${contract.user_signed_at ? `<div style="font-size: 11px; color: #059669;">Signed: ${new Date(contract.user_signed_at).toLocaleString()}</div>` : ''}
                    </div>
                </div>
            </body>
            </html>
        `;

        // Import puppeteer dynamically
        const puppeteer = (await import('puppeteer')).default;

        browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
        });

        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=contract-${contract.id}.pdf`);
        res.send(pdfBuffer);

        log.info('Contract PDF generated', { contractId: id });
    } catch (error) {
        log.error('Failed to generate contract PDF', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

// ===========================================
// CONTRACT COMMENTS ENDPOINTS
// ===========================================

// Add comment to contract
router.post('/:id/comments', async (req, res) => {
    const log = logger.child({ action: 'add-contract-comment', contractId: req.params.id });

    try {
        const contractId = parseInt(req.params.id);
        const { author_name, content, parent_comment_id, is_internal } = req.body;

        if (!content) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Verify contract exists
        const { data: contract } = await supabase
            .from('contracts')
            .select('id')
            .eq('id', contractId)
            .single();

        if (!contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        const { data: comment, error } = await supabase
            .from('contract_comments')
            .insert({
                contract_id: contractId,
                author_name: author_name || 'Anonymous',
                content,
                parent_comment_id: parent_comment_id || null,
                is_internal: is_internal || false,
                is_resolved: false
            })
            .select()
            .single();

        if (error) throw error;

        log.info('Comment added to contract', { contractId, commentId: comment.id });
        return res.status(201).json({ comment });
    } catch (error) {
        log.error('Failed to add contract comment', error);
        return res.status(500).json({ error: 'Failed to add comment' });
    }
});

// Get comments for contract
router.get('/:id/comments', async (req, res) => {
    const log = logger.child({ action: 'get-contract-comments', contractId: req.params.id });

    try {
        const contractId = parseInt(req.params.id);

        const { data: comments, error } = await supabase
            .from('contract_comments')
            .select('*')
            .eq('contract_id', contractId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        log.info('Contract comments fetched', { contractId, count: comments?.length || 0 });
        return res.json({ comments: comments || [] });
    } catch (error) {
        log.error('Failed to get contract comments', error);
        return res.status(500).json({ error: 'Failed to get comments' });
    }
});

// Resolve/unresolve comment
router.patch('/:id/comments/:commentId/resolve', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'resolve-contract-comment', commentId: req.params.commentId });

    try {
        const commentId = parseInt(req.params.commentId);
        const { is_resolved } = req.body;

        const { data: comment, error } = await supabase
            .from('contract_comments')
            .update({ is_resolved: is_resolved ?? true })
            .eq('id', commentId)
            .select()
            .single();

        if (error) throw error;

        log.info('Comment resolved', { commentId, isResolved: is_resolved });
        return res.json({ comment });
    } catch (error) {
        log.error('Failed to resolve comment', error);
        return res.status(500).json({ error: 'Failed to resolve comment' });
    }
});

// Create invoice from contract (workflow automation)
router.post('/:id/create-invoice', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-invoice-from-contract', contractId: req.params.id });

    try {
        const userId = req.user!.userId;
        const contractId = parseInt(req.params.id);

        // Get the contract
        const { data: contract, error: contractError } = await supabase
            .from('contracts')
            .select('*')
            .eq('id', contractId)
            .eq('user_id', userId)
            .single();

        if (contractError || !contract) {
            return res.status(404).json({ error: 'Contract not found' });
        }

        // Build line items from deliverables
        const lineItems = (contract.deliverables || []).map((d: any) => ({
            description: d.name || 'Service',
            quantity: 1,
            unit_price: d.price || 0,
            amount: d.price || 0
        }));

        // Generate invoice number
        const invoiceNumber = `INV-${Date.now().toString(36).toUpperCase()}`;

        // Calculate totals
        const subtotal = lineItems.reduce((sum: number, item: any) => sum + (item.amount || 0), 0);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30); // 30 days from now

        // Create the invoice
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .insert({
                user_id: userId,
                contract_id: contractId,
                client_id: contract.client_id,
                invoice_number: invoiceNumber,
                title: `Invoice - ${contract.client_name || 'Client'}`,
                client_name: contract.client_name || '',
                client_email: contract.client_email || '',
                client_company: contract.client_company || '',
                client_address: contract.client_address || '',
                line_items: lineItems,
                subtotal: subtotal,
                tax_rate: 0,
                tax_amount: 0,
                total: subtotal,
                due_date: dueDate.toISOString().split('T')[0],
                status: 'draft',
                notes: `Invoice generated from Contract: ${contract.title}`
            })
            .select()
            .single();

        if (invoiceError || !invoice) {
            throw invoiceError || new Error('Failed to create invoice');
        }

        log.info('Invoice created from contract', { contractId, invoiceId: invoice.id });
        res.status(201).json({ invoice });
    } catch (error) {
        log.error('Create invoice from contract error:', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

export default router;
