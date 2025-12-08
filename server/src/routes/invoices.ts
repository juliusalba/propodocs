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

// Generate unique invoice number
function generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const random = crypto.randomBytes(3).toString('hex').toUpperCase();
    return `INV-${year}${month}-${random}`;
}

// Request schemas
const CreateInvoiceSchema = z.object({
    proposal_id: z.number().optional(),
    client_name: z.string().min(1),
    client_company: z.string().optional(),
    client_email: z.string().email().optional(),
    client_address: z.string().optional(),
    title: z.string().min(1),
    line_items: z.array(z.object({
        id: z.string(),
        description: z.string(),
        quantity: z.number(),
        unitPrice: z.number(),
        amount: z.number(),
    })),
    tax_rate: z.number().optional(),
    due_date: z.string().optional(),
    payment_terms: z.enum(['net_30', 'net_15', 'due_on_receipt']).optional(),
    milestone_number: z.number().optional(),
    milestone_total: z.number().optional(),
    notes: z.string().optional(),
});

// List invoices
router.get('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'list-invoices', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const { status, proposalId } = req.query;

        let query = supabase
            .from('invoices')
            .select('*')
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

        log.info('Invoices fetched', { count: data?.length || 0 });
        res.json({ invoices: data || [] });
    } catch (error) {
        log.error('Failed to fetch invoices', error);
        res.status(500).json({ error: 'Failed to fetch invoices' });
    }
});

// Get single invoice
router.get('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'get-invoice', invoiceId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { data, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error) throw error;
        if (!data) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        res.json(data);
    } catch (error) {
        log.error('Failed to fetch invoice', error);
        res.status(500).json({ error: 'Failed to fetch invoice' });
    }
});

// Create invoice
router.post('/', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'create-invoice', userId: req.user?.userId?.toString() });

    try {
        const userId = req.user!.userId;
        const input = CreateInvoiceSchema.parse(req.body);

        // Calculate totals
        const subtotal = input.line_items.reduce((sum, item) => sum + item.amount, 0);
        const taxRate = input.tax_rate || 0;
        const taxAmount = subtotal * (taxRate / 100);
        const total = subtotal + taxAmount;

        const invoiceNumber = generateInvoiceNumber();

        const { data, error } = await supabase
            .from('invoices')
            .insert({
                user_id: userId,
                proposal_id: input.proposal_id,
                invoice_number: invoiceNumber,
                client_name: input.client_name,
                client_company: input.client_company,
                client_email: input.client_email,
                client_address: input.client_address,
                title: input.title,
                line_items: input.line_items,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total,
                due_date: input.due_date,
                payment_terms: input.payment_terms || 'net_30',
                milestone_number: input.milestone_number || 1,
                milestone_total: input.milestone_total || 1,
                notes: input.notes,
                status: 'draft',
            })
            .select()
            .single();

        if (error) throw error;

        log.info('Invoice created', { invoiceId: data.id, invoiceNumber });
        res.json(data);
    } catch (error) {
        log.error('Failed to create invoice', error);
        res.status(500).json({ error: 'Failed to create invoice' });
    }
});

// Update invoice
router.put('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'update-invoice', invoiceId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;
        const updates = req.body;

        // Recalculate totals if line_items changed
        if (updates.line_items) {
            updates.subtotal = updates.line_items.reduce((sum: number, item: any) => sum + item.amount, 0);
            updates.tax_amount = updates.subtotal * ((updates.tax_rate || 0) / 100);
            updates.total = updates.subtotal + updates.tax_amount;
        }

        updates.updated_at = new Date().toISOString();

        const { data, error } = await supabase
            .from('invoices')
            .update(updates)
            .eq('id', id)
            .eq('user_id', userId)
            .select()
            .single();

        if (error) throw error;

        log.info('Invoice updated', { invoiceId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to update invoice', error);
        res.status(500).json({ error: 'Failed to update invoice' });
    }
});

// Delete invoice
router.delete('/:id', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'delete-invoice', invoiceId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        const { error } = await supabase
            .from('invoices')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) throw error;

        log.info('Invoice deleted', { invoiceId: id });
        res.json({ success: true });
    } catch (error) {
        log.error('Failed to delete invoice', error);
        res.status(500).json({ error: 'Failed to delete invoice' });
    }
});

// Send invoice (mark as sent)
router.post('/:id/send', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'send-invoice', invoiceId: req.params.id });

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        // Get invoice data first
        const { data: invoice, error: fetchError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (fetchError || !invoice) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        // Update status to sent
        const { data, error } = await supabase
            .from('invoices')
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
        if (invoice.client_email) {
            try {
                const { sendInvoiceEmail } = await import('../utils/email.js');
                const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

                await sendInvoiceEmail({
                    to: invoice.client_email,
                    clientName: invoice.client_name,
                    invoiceNumber: invoice.invoice_number,
                    amount: invoice.total,
                    dueDate: invoice.due_date,
                    viewLink: `${frontendUrl}/invoice/${invoice.id}`,
                    paymentLink: invoice.payment_link || undefined,
                });
                log.info('Invoice email sent', { to: invoice.client_email });
            } catch (emailError) {
                log.error('Failed to send invoice email', emailError);
                // Don't fail the whole request if email fails
            }
        }

        log.info('Invoice sent', { invoiceId: id });
        res.json(data);
    } catch (error) {
        log.error('Failed to send invoice', error);
        res.status(500).json({ error: 'Failed to send invoice' });
    }
});

// Generate invoice from proposal
router.post('/from-proposal/:proposalId', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'generate-invoice-from-proposal', proposalId: req.params.proposalId });

    try {
        const userId = req.user!.userId;
        const { proposalId } = req.params;
        const { milestones = 1 } = req.body;

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

        // Extract line items from calculator_data
        const calcData = proposal.calculator_data as any;
        const lineItems = [];

        // Add selected tier
        if (calcData.selectedTier) {
            lineItems.push({
                id: crypto.randomUUID(),
                description: `${calcData.selectedTier.name} - Monthly Retainer`,
                quantity: 1,
                unitPrice: calcData.selectedTier.monthlyPrice || 0,
                amount: calcData.selectedTier.monthlyPrice || 0,
            });
            if (calcData.selectedTier.setupFee > 0) {
                lineItems.push({
                    id: crypto.randomUUID(),
                    description: `${calcData.selectedTier.name} - Setup Fee`,
                    quantity: 1,
                    unitPrice: calcData.selectedTier.setupFee,
                    amount: calcData.selectedTier.setupFee,
                });
            }
        }

        // Add add-ons
        if (calcData.addOnStates) {
            for (const [key, addon] of Object.entries(calcData.addOnStates as Record<string, any>)) {
                if (addon.selected) {
                    const qty = addon.quantity || 1;
                    lineItems.push({
                        id: crypto.randomUUID(),
                        description: addon.name || key,
                        quantity: qty,
                        unitPrice: addon.price || 0,
                        amount: (addon.price || 0) * qty,
                    });
                }
            }
        }

        // Fallback to totals if no line items
        if (lineItems.length === 0 && calcData.totals) {
            lineItems.push({
                id: crypto.randomUUID(),
                description: 'Marketing Services',
                quantity: 1,
                unitPrice: calcData.totals.monthlyTotal || 0,
                amount: calcData.totals.monthlyTotal || 0,
            });
        }

        // Calculate per-milestone amounts
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const milestoneAmount = subtotal / milestones;

        // Create invoice(s)
        const createdInvoices = [];
        for (let i = 1; i <= milestones; i++) {
            const invoiceNumber = generateInvoiceNumber();
            const scaledLineItems = lineItems.map(item => ({
                ...item,
                amount: item.amount / milestones,
            }));

            const { data: invoice, error } = await supabase
                .from('invoices')
                .insert({
                    user_id: userId,
                    proposal_id: parseInt(proposalId),
                    invoice_number: invoiceNumber,
                    client_name: proposal.client_name,
                    client_company: proposal.client_company,
                    client_email: proposal.client_email,
                    title: milestones > 1
                        ? `${proposal.title} - Payment ${i} of ${milestones}`
                        : proposal.title,
                    line_items: scaledLineItems,
                    subtotal: milestoneAmount,
                    tax_rate: 0,
                    tax_amount: 0,
                    total: milestoneAmount,
                    payment_terms: 'net_30',
                    milestone_number: i,
                    milestone_total: milestones,
                    status: 'draft',
                })
                .select()
                .single();

            if (error) throw error;
            createdInvoices.push(invoice);
        }

        log.info('Invoice(s) generated from proposal', {
            proposalId,
            invoiceCount: createdInvoices.length
        });
        res.json({ invoices: createdInvoices });
    } catch (error) {
        log.error('Failed to generate invoice from proposal', error);
        res.status(500).json({ error: 'Failed to generate invoice' });
    }
});

// Generate Invoice PDF
router.post('/:id/pdf', authMiddleware, async (req: AuthRequest, res) => {
    const log = logger.child({ action: 'generate-invoice-pdf', invoiceId: req.params.id });
    let browser;

    try {
        const userId = req.user!.userId;
        const { id } = req.params;

        // Fetch invoice
        const { data: invoice, error } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', id)
            .eq('user_id', userId)
            .single();

        if (error || !invoice) {
            res.status(404).json({ error: 'Invoice not found' });
            return;
        }

        // Generate HTML for PDF
        const lineItemsHTML = (invoice.line_items || []).map((item: any) => `
            <tr>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right;">$${item.unitPrice?.toLocaleString() || 0}</td>
                <td style="padding: 12px; border-bottom: 1px solid #e5e7eb; text-align: right; font-weight: 600;">$${item.amount?.toLocaleString() || 0}</td>
            </tr>
        `).join('');

        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif; color: #1f2937; line-height: 1.6; padding: 40px; }
                    .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
                    .logo { font-size: 28px; font-weight: 300; letter-spacing: 2px; color: #7A1E1E; }
                    .invoice-info { text-align: right; }
                    .invoice-number { font-size: 24px; font-weight: 700; color: #1f2937; }
                    .invoice-date { color: #6b7280; font-size: 14px; }
                    .parties { display: flex; gap: 40px; margin-bottom: 40px; }
                    .party { flex: 1; }
                    .party-label { font-size: 12px; text-transform: uppercase; color: #6b7280; margin-bottom: 8px; font-weight: 600; }
                    .party-name { font-weight: 700; color: #1f2937; font-size: 16px; }
                    .party-details { color: #6b7280; font-size: 14px; }
                    table { width: 100%; border-collapse: collapse; margin-bottom: 32px; }
                    th { text-align: left; padding: 12px; background: #f9fafb; border-bottom: 2px solid #e5e7eb; font-size: 12px; text-transform: uppercase; color: #6b7280; }
                    .totals { margin-left: auto; width: 300px; }
                    .total-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
                    .total-row.final { border-top: 2px solid #1f2937; border-bottom: none; padding-top: 16px; font-size: 20px; font-weight: 700; }
                    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
                    .status-paid { background: #d1fae5; color: #059669; }
                    .status-sent { background: #fef3c7; color: #d97706; }
                    .status-draft { background: #e5e7eb; color: #6b7280; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div>
                        <div class="logo">Propodocs</div>
                        <div style="color: #6b7280; font-size: 14px; margin-top: 8px;">Proposal Management Platform</div>
                    </div>
                    <div class="invoice-info">
                        <div class="invoice-number">Invoice ${invoice.invoice_number}</div>
                        <div class="invoice-date">Date: ${new Date(invoice.created_at).toLocaleDateString()}</div>
                        ${invoice.due_date ? `<div class="invoice-date">Due: ${new Date(invoice.due_date).toLocaleDateString()}</div>` : ''}
                        <div style="margin-top: 8px;"><span class="status status-${invoice.status}">${invoice.status}</span></div>
                    </div>
                </div>
                
                <div class="parties">
                    <div class="party">
                        <div class="party-label">Bill To</div>
                        <div class="party-name">${invoice.client_name}</div>
                        ${invoice.client_company ? `<div class="party-details">${invoice.client_company}</div>` : ''}
                        ${invoice.client_email ? `<div class="party-details">${invoice.client_email}</div>` : ''}
                        ${invoice.client_address ? `<div class="party-details">${invoice.client_address}</div>` : ''}
                    </div>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: center;">Qty</th>
                            <th style="text-align: right;">Unit Price</th>
                            <th style="text-align: right;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${lineItemsHTML}
                    </tbody>
                </table>

                <div class="totals">
                    <div class="total-row">
                        <span>Subtotal</span>
                        <span>$${(invoice.subtotal || 0).toLocaleString()}</span>
                    </div>
                    ${invoice.tax_rate > 0 ? `
                    <div class="total-row">
                        <span>Tax (${invoice.tax_rate}%)</span>
                        <span>$${(invoice.tax_amount || 0).toLocaleString()}</span>
                    </div>
                    ` : ''}
                    <div class="total-row final">
                        <span>Total</span>
                        <span>$${(invoice.total || 0).toLocaleString()}</span>
                    </div>
                </div>

                ${invoice.notes ? `
                <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
                    <div style="font-weight: 600; margin-bottom: 8px;">Notes</div>
                    <div style="color: #6b7280; font-size: 14px;">${invoice.notes}</div>
                </div>
                ` : ''}
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
        res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoice_number}.pdf`);
        res.send(pdfBuffer);

        log.info('Invoice PDF generated', { invoiceId: id });
    } catch (error) {
        log.error('Failed to generate invoice PDF', error);
        if (browser) await browser.close();
        res.status(500).json({ error: 'Failed to generate PDF' });
    }
});

export default router;
