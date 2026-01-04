/**
 * Notification Service
 * Handles sending notifications via email, SMS, and push
 * Respects user preferences before sending
 */

import { Resend } from 'resend';
import supabase from '../db/index.js';
import { logger } from '../utils/logger.js';
import dotenv from 'dotenv';

dotenv.config();

// Email configuration
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || 'Propodocs';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// SMS configuration (Twilio)
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const twilioConfigured = !!(TWILIO_ACCOUNT_SID && TWILIO_AUTH_TOKEN && TWILIO_PHONE_NUMBER);

// Notification event types
export type NotificationEventType =
    | 'proposal_viewed'
    | 'proposal_accepted'
    | 'proposal_rejected'
    | 'comment_added'
    | 'contract_signed'
    | 'contract_updated'
    | 'invoice_paid'
    | 'proposal_updated';

export interface NotificationPayload {
    userId: number;
    type: NotificationEventType;
    title: string;
    message: string;
    data?: Record<string, any>;
    link?: string;
}

/**
 * Check if user has enabled a specific notification channel for an event type
 */
async function isNotificationEnabled(
    userId: number,
    channel: 'email' | 'sms' | 'push',
    eventType: NotificationEventType
): Promise<boolean> {
    const { data } = await supabase
        .from('notification_preferences')
        .select('enabled')
        .eq('user_id', userId)
        .eq('channel', channel)
        .eq('event_type', eventType)
        .single();

    // Default to true if no preference exists
    return data?.enabled ?? true;
}

/**
 * Log notification to database
 */
async function logNotification(payload: NotificationPayload): Promise<number | null> {
    const { data, error } = await supabase
        .from('notifications')
        .insert({
            user_id: payload.userId,
            type: payload.type,
            title: payload.title,
            message: payload.message,
            data: payload.data || {},
            link: payload.link,
            is_read: false
        })
        .select('id')
        .single();

    if (error) {
        logger.error('Failed to log notification', error);
        return null;
    }

    return data.id;
}

/**
 * Get user email by ID
 */
async function getUserEmail(userId: number): Promise<string | null> {
    const { data } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

    return data?.email || null;
}

/**
 * Get user phone by ID
 */
async function getUserPhone(userId: number): Promise<string | null> {
    const { data } = await supabase
        .from('users')
        .select('phone')
        .eq('id', userId)
        .single();

    return data?.phone || null;
}

/**
 * Send email notification
 */
async function sendEmailNotification(
    userId: number,
    payload: NotificationPayload
): Promise<boolean> {
    const email = await getUserEmail(userId);
    if (!email) {
        logger.warn(`No email found for user ${userId}`);
        return false;
    }

    const ctaLink = payload.link ? `${FRONTEND_URL}${payload.link}` : FRONTEND_URL;

    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" style="max-width: 600px; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); padding: 32px; text-align: center;">
                            <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 300; letter-spacing: 2px;">PROPODOCS</h1>
                        </td>
                    </tr>
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <h2 style="margin: 0 0 16px 0; color: #1f2937; font-size: 20px;">${payload.title}</h2>
                            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">${payload.message}</p>
                            <a href="${ctaLink}" style="display: inline-block; background: linear-gradient(135deg, #7A1E1E, #501010); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600;">View Details</a>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background: #f9fafb; padding: 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                You're receiving this because you have notifications enabled.
                                <br>
                                <a href="${FRONTEND_URL}/settings" style="color: #7A1E1E;">Manage preferences</a>
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
    `.trim();

    if (resend) {
        try {
            const { error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [email],
                subject: payload.title,
                html: htmlContent,
            });

            if (error) {
                logger.error('Resend error', error);
                return false;
            }

            logger.info('Email notification sent', { email, title: payload.title });
            return true;
        } catch (e) {
            logger.error('Email send error', e);
            return false;
        }
    } else {
        logger.info('[MOCK] Email sent', { email, title: payload.title });
        return true;
    }
}

/**
 * Main notification function
 * Checks preferences, logs to DB, and sends via enabled channels
 */
export async function sendNotification(payload: NotificationPayload): Promise<void> {
    const { userId, type } = payload;

    // Always log the notification to database
    await logNotification(payload);

    // Check email preference and send if enabled
    const emailEnabled = await isNotificationEnabled(userId, 'email', type);
    if (emailEnabled) {
        await sendEmailNotification(userId, payload);
    }

    // Check SMS preference and send if enabled
    const smsEnabled = await isNotificationEnabled(userId, 'sms', type);
    if (smsEnabled) {
        await sendSMSNotification(userId, payload);
    }

    // Future: Check push preference
    // const pushEnabled = await isNotificationEnabled(userId, 'push', type);
    // if (pushEnabled) { await sendPushNotification(userId, payload); }
}

/**
 * Send SMS notification via Twilio
 * Gracefully skips if Twilio is not configured or package not installed
 */
async function sendSMSNotification(
    userId: number,
    payload: NotificationPayload
): Promise<boolean> {
    // Skip if Twilio not configured
    if (!twilioConfigured) {
        logger.debug('[SMS SKIPPED] Twilio not configured', { userId: String(userId), title: payload.title });
        return false;
    }

    const phone = await getUserPhone(userId);
    if (!phone) {
        logger.debug('[SMS SKIPPED] No phone number', { userId: String(userId) });
        return false;
    }

    try {
        // Dynamic require to avoid requiring twilio package when not installed
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const twilio = require('twilio') as any;
        const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

        const shortLink = payload.link ? ` ${FRONTEND_URL}${payload.link}` : '';
        const body = `${payload.title}: ${payload.message.slice(0, 140)}${shortLink}`;

        await client.messages.create({
            body,
            from: TWILIO_PHONE_NUMBER,
            to: phone
        });

        logger.info('SMS notification sent', { phone, title: payload.title });
        return true;
    } catch (error: any) {
        if (error.code === 'MODULE_NOT_FOUND') {
            logger.warn('[SMS SKIPPED] Twilio package not installed');
        } else {
            logger.error('SMS send error', error);
        }
        return false;
    }
}

/**
 * Send notification to proposal owner when proposal is viewed
 */
export async function notifyProposalViewed(proposalId: number, viewerInfo?: string): Promise<void> {
    const { data: proposal } = await supabase
        .from('proposals')
        .select('user_id, title, client_name')
        .eq('id', proposalId)
        .single();

    if (!proposal) return;

    await sendNotification({
        userId: proposal.user_id,
        type: 'proposal_viewed',
        title: 'Your proposal was viewed',
        message: `${proposal.client_name || 'Someone'} viewed your proposal "${proposal.title}".`,
        data: { proposalId, viewerInfo },
        link: `/proposals/${proposalId}`
    });
}

/**
 * Send notification when proposal status changes
 */
export async function notifyProposalStatusChange(
    proposalId: number,
    newStatus: 'accepted' | 'rejected'
): Promise<void> {
    const { data: proposal } = await supabase
        .from('proposals')
        .select('user_id, title, client_name')
        .eq('id', proposalId)
        .single();

    if (!proposal) return;

    const isAccepted = newStatus === 'accepted';

    await sendNotification({
        userId: proposal.user_id,
        type: isAccepted ? 'proposal_accepted' : 'proposal_rejected',
        title: isAccepted ? '🎉 Proposal Accepted!' : 'Proposal Declined',
        message: isAccepted
            ? `Great news! ${proposal.client_name || 'Your client'} accepted your proposal "${proposal.title}".`
            : `${proposal.client_name || 'Your client'} declined your proposal "${proposal.title}".`,
        data: { proposalId, status: newStatus },
        link: `/proposals/${proposalId}`
    });
}

/**
 * Send notification when a comment is added
 */
export async function notifyCommentAdded(
    proposalId: number,
    commenterName: string,
    commentPreview: string
): Promise<void> {
    const { data: proposal } = await supabase
        .from('proposals')
        .select('user_id, title')
        .eq('id', proposalId)
        .single();

    if (!proposal) return;

    await sendNotification({
        userId: proposal.user_id,
        type: 'comment_added',
        title: 'New comment on your proposal',
        message: `${commenterName} commented: "${commentPreview.slice(0, 100)}${commentPreview.length > 100 ? '...' : ''}"`,
        data: { proposalId, commenterName },
        link: `/proposals/${proposalId}`
    });
}

/**
 * Send notification when contract is signed
 */
export async function notifyContractSigned(
    contractId: number,
    signerName: string
): Promise<void> {
    const { data: contract } = await supabase
        .from('contracts')
        .select('user_id, title, client_name')
        .eq('id', contractId)
        .single();

    if (!contract) return;

    await sendNotification({
        userId: contract.user_id,
        type: 'contract_signed',
        title: '✍️ Contract Signed!',
        message: `${signerName || contract.client_name || 'Your client'} signed the contract "${contract.title}".`,
        data: { contractId, signerName },
        link: `/contracts/${contractId}`
    });
}

/**
 * Send notification when invoice is paid
 */
export async function notifyInvoicePaid(
    invoiceId: number,
    amount: number
): Promise<void> {
    const { data: invoice } = await supabase
        .from('invoices')
        .select('user_id, invoice_number, client_name')
        .eq('id', invoiceId)
        .single();

    if (!invoice) return;

    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);

    await sendNotification({
        userId: invoice.user_id,
        type: 'invoice_paid',
        title: '💰 Payment Received!',
        message: `${invoice.client_name || 'Your client'} paid ${formattedAmount} for Invoice #${invoice.invoice_number}.`,
        data: { invoiceId, amount },
        link: `/invoices/${invoiceId}`
    });
}
