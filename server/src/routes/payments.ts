import express, { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { sendPaymentConfirmationEmail } from '../utils/email.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

const router: Router = express.Router();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Stripe with secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
    apiVersion: '2025-11-17.clover' as any,
}) : null;

// ===========================================
// CREATE PAYMENT LINK FOR INVOICE
// ===========================================

router.post('/create-payment-link/:invoiceId', async (req: Request, res: Response) => {
    try {
        if (!stripe) {
            return res.status(503).json({ error: 'Stripe not configured' });
        }

        const { invoiceId } = req.params;

        // Get invoice details
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            return res.status(404).json({ error: 'Invoice not found' });
        }

        // Create a Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: invoice.currency || 'usd',
                        product_data: {
                            name: invoice.title || `Invoice #${invoice.invoice_number}`,
                            description: `Invoice for ${invoice.client_name}`,
                        },
                        unit_amount: Math.round((invoice.balance_due || invoice.total) * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${process.env.FRONTEND_URL}/invoices/${invoiceId}?payment=success`,
            cancel_url: `${process.env.FRONTEND_URL}/invoices/${invoiceId}?payment=cancelled`,
            customer_email: invoice.client_email || undefined,
            metadata: {
                invoice_id: invoiceId,
                invoice_number: invoice.invoice_number,
            },
        });

        // Update invoice with payment link
        await supabase
            .from('invoices')
            .update({
                payment_link: session.url,
                payment_platform: 'stripe',
            })
            .eq('id', invoiceId);

        res.json({
            success: true,
            paymentLink: session.url,
            sessionId: session.id,
        });
    } catch (error: any) {
        logger.error('Error creating payment link', error);
        res.status(500).json({ error: error.message });
    }
});

// ===========================================
// STRIPE WEBHOOK HANDLER
// ===========================================

router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
    if (!stripe || !stripeWebhookSecret) {
        return res.status(503).json({ error: 'Stripe not configured' });
    }

    const sig = req.headers['stripe-signature'] as string;

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } catch (err: any) {
        logger.error('Webhook signature verification failed', err);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    logger.info('Received Stripe webhook', { type: event.type });

    // Handle the event
    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleSuccessfulPayment(session);
            break;
        }
        case 'payment_intent.succeeded': {
            const paymentIntent = event.data.object as Stripe.PaymentIntent;
            logger.info('Payment intent succeeded', { id: paymentIntent.id });
            break;
        }
        case 'payment_intent.payment_failed': {
            const failedPayment = event.data.object as Stripe.PaymentIntent;
            logger.warn('Payment failed', { id: failedPayment.id });
            // Could add notification logic here
            break;
        }
        default:
            logger.debug('Unhandled event type', { type: event.type });
    }

    res.json({ received: true });
});

// ===========================================
// HANDLE SUCCESSFUL PAYMENT
// ===========================================

async function handleSuccessfulPayment(session: Stripe.Checkout.Session) {
    const invoiceId = session.metadata?.invoice_id;
    if (!invoiceId) {
        logger.error('No invoice ID in session metadata');
        return;
    }

    logger.info('Processing payment for invoice', { invoiceId });

    try {
        // Get invoice details
        const { data: invoice, error: invoiceError } = await supabase
            .from('invoices')
            .select('*')
            .eq('id', invoiceId)
            .single();

        if (invoiceError || !invoice) {
            logger.error('Invoice not found', { invoiceId });
            return;
        }

        const paymentAmount = (session.amount_total || 0) / 100; // Convert from cents

        // Record the payment
        const { error: paymentError } = await supabase
            .from('invoice_payments')
            .insert({
                invoice_id: parseInt(invoiceId),
                amount: paymentAmount,
                payment_method: 'stripe',
                transaction_id: session.payment_intent as string,
                status: 'completed',
                payment_date: new Date().toISOString(),
                metadata: {
                    session_id: session.id,
                    customer_email: session.customer_email,
                    payment_status: session.payment_status,
                },
            });

        if (paymentError) {
            logger.error('Failed to record payment', paymentError);
        }

        // Update invoice status
        const newAmountPaid = (invoice.amount_paid || 0) + paymentAmount;
        const newBalanceDue = invoice.total - newAmountPaid;
        const newStatus = newBalanceDue <= 0 ? 'paid' : invoice.status;

        const { error: updateError } = await supabase
            .from('invoices')
            .update({
                amount_paid: newAmountPaid,
                balance_due: newBalanceDue,
                status: newStatus,
                paid_at: newStatus === 'paid' ? new Date().toISOString() : null,
            })
            .eq('id', invoiceId);

        if (updateError) {
            logger.error('Failed to update invoice', updateError);
        }

        // Send confirmation email
        if (invoice.client_email) {
            try {
                await sendPaymentConfirmationEmail({
                    to: invoice.client_email,
                    clientName: invoice.client_name,
                    invoiceNumber: invoice.invoice_number,
                    amount: paymentAmount,
                    paymentMethod: 'Credit Card (Stripe)',
                });
            } catch (emailError) {
                logger.error('Failed to send confirmation email', emailError);
            }
        }

        logger.info('Invoice payment processed successfully', { invoiceId });
    } catch (error) {
        logger.error('Error processing payment', error);
    }
}

// ===========================================
// GET PAYMENT STATUS
// ===========================================

router.get('/status/:invoiceId', async (req: Request, res: Response) => {
    try {
        const { invoiceId } = req.params;

        // Get payment history for invoice
        const { data: payments, error } = await supabase
            .from('invoice_payments')
            .select('*')
            .eq('invoice_id', invoiceId)
            .order('payment_date', { ascending: false });

        if (error) {
            throw error;
        }

        // Get invoice details
        const { data: invoice } = await supabase
            .from('invoices')
            .select('total, amount_paid, balance_due, status')
            .eq('id', invoiceId)
            .single();

        res.json({
            invoice: invoice || {},
            payments: payments || [],
        });
    } catch (error: any) {
        logger.error('Error getting payment status', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
