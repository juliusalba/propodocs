import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev';
const FROM_NAME = process.env.FROM_NAME || 'Propodocs';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Initialize Resend if API key is available
const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

interface PasswordResetEmailData {
    to: string;
    name: string;
    resetToken: string;
}

export async function sendPasswordResetEmail(data: PasswordResetEmailData): Promise<void> {
    const resetLink = `${FRONTEND_URL}/reset-password?token=${data.resetToken}`;

    const textContent = `
Hello ${data.name},

You requested to reset your password for your Propodocs account.

Click the link below to reset your password:
${resetLink}

This link will expire in 1 hour.

If you didn't request this password reset, please ignore this email.

Best regards,
Propodocs Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <title>Reset Your Password</title>
    <!--[if mso]>
    <style type="text/css">
        body, table, td {font-family: Arial, Helvetica, sans-serif !important;}
    </style>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td style="padding: 40px 20px;">
                <!-- Main Container -->
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); padding: 48px 40px; text-align: center;">
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase;">
                                Propodocs
                            </h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 300; letter-spacing: 0.5px;">
                                Proposal Management System
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 48px 40px;">
                            <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">
                                Reset Your Password
                            </h2>
                            
                            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hello <strong>${data.name}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                We received a request to reset the password for your Propodocs account. Click the button below to choose a new password.
                            </p>
                            
                            <!-- CTA Button -->
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 0 0 32px 0;">
                                        <a href="${resetLink}" style="display: inline-block; background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(122, 30, 30, 0.2);">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- Alternative Link -->
                            <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 0 0 32px 0;">
                                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 13px; font-weight: 500;">
                                    Or copy and paste this link into your browser:
                                </p>
                                <p style="margin: 0; color: #7A1E1E; font-size: 13px; word-break: break-all; line-height: 1.5;">
                                    ${resetLink}
                                </p>
                            </div>
                            
                            <!-- Warning Box -->
                            <div style="background: linear-gradient(to right, #fef3c7, #fef9e7); border-left: 4px solid #f59e0b; border-radius: 6px; padding: 16px 20px; margin: 0 0 32px 0;">
                                <p style="margin: 0; color: #92400e; font-size: 14px; font-weight: 500;">
                                    ⏱️ This link will expire in <strong>1 hour</strong> for security reasons.
                                </p>
                            </div>
                            
                            <!-- Security Notice -->
                            <div style="border-top: 1px solid #e5e7eb; padding-top: 24px;">
                                <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.6;">
                                    If you didn't request this password reset, you can safely ignore this email. Your password will remain unchanged.
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                                PROPODOCS
                            </p>
                            <p style="margin: 0 0 16px 0; color: #6b7280; font-size: 13px; line-height: 1.6;">
                                705 Washington Avenue Suite 300<br>
                                Miami Beach, Florida 33139
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Propodocs. All rights reserved.
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

    // If Resend is configured, send the email
    if (resend) {
        try {
            const { data: emailData, error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [data.to],
                subject: 'Reset Your Password - Propodocs',
                text: textContent,
                html: htmlContent,
            });

            if (error) {
                console.error('❌ Resend error:', error);
                throw new Error('Failed to send password reset email');
            }

            console.log(`✅ Password reset email sent to ${data.to} (ID: ${emailData?.id})`);
        } catch (error: any) {
            console.error('❌ Resend error:', error);
            throw new Error('Failed to send password reset email');
        }
    } else {
        // Fallback: Log to console for development
        console.log('\n📧 ===== PASSWORD RESET EMAIL (Resend not configured) =====');
        console.log(`To: ${data.to}`);
        console.log('Subject: Reset Your Password - Propodocs');
        console.log('\n--- Email Content ---');
        console.log(textContent);
        console.log('\n--- Reset Link ---');
        console.log(resetLink);
        console.log('==========================================================\n');
    }
}

interface ProposalLinkEmailData {
    to: string;
    clientName: string;
    link: string;
    message?: string;
}

export async function sendProposalLinkEmail(data: ProposalLinkEmailData): Promise<void> {
    const textContent = `
Hello ${data.clientName},

You have received a new proposal from Propodocs.

Click the link below to view your proposal:
${data.link}

${data.message ? `Message from sender:\n${data.message}\n` : ''}

Best regards,
Propodocs Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Proposal</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); padding: 48px 40px; text-align: center;">
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase;">
                                Propodocs
                            </h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 14px; font-weight: 300; letter-spacing: 0.5px;">
                                New Proposal for ${data.clientName}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 48px 40px;">
                            <h2 style="margin: 0 0 24px 0; color: #111827; font-size: 24px; font-weight: 600; line-height: 1.3;">
                                You've Received a Proposal
                            </h2>
                            
                            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hello <strong>${data.clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 32px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                We have prepared a new proposal for you. Click the button below to view the details.
                            </p>

                            ${data.message ? `
                            <div style="background-color: #f9fafb; border-left: 4px solid #7A1E1E; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
                                <p style="margin: 0; color: #374151; font-style: italic;">"${data.message}"</p>
                            </div>
                            ` : ''}
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 0 0 32px 0;">
                                        <a href="${data.link}" style="display: inline-block; background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(122, 30, 30, 0.2);">
                                            View Proposal
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                                PROPODOCS
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Propodocs. All rights reserved.
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
            const { data: emailData, error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [data.to],
                subject: `New Proposal for ${data.clientName} - Propodocs`,
                text: textContent,
                html: htmlContent,
            });

            if (error) {
                console.error('❌ Resend error:', error);
                throw new Error('Failed to send proposal email');
            }

            console.log(`✅ Proposal email sent to ${data.to} (ID: ${emailData?.id})`);
        } catch (error: any) {
            console.error('❌ Resend error:', error);
            throw new Error('Failed to send proposal email');
        }
    } else {
        console.log('\n📧 ===== PROPOSAL EMAIL (Resend not configured) =====');
        console.log(`To: ${data.to}`);
        console.log(`Subject: New Proposal for ${data.clientName} - Propodocs`);
        console.log('\n--- Email Content ---');
        console.log(textContent);
        console.log('\n--- Link ---');
        console.log(data.link);
        console.log('=====================================================\n');
    }
}

// ===========================================
// INVOICE EMAIL
// ===========================================

interface InvoiceEmailData {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    dueDate?: string;
    viewLink: string;
    paymentLink?: string;
    message?: string;
}

export async function sendInvoiceEmail(data: InvoiceEmailData): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(data.amount);

    const dueDateText = data.dueDate
        ? `Due: ${new Date(data.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`
        : 'Due on receipt';

    const textContent = `
Hello ${data.clientName},

You have received Invoice #${data.invoiceNumber} for ${formattedAmount}.
${dueDateText}

View your invoice: ${data.viewLink}
${data.paymentLink ? `Pay now: ${data.paymentLink}` : ''}

${data.message ? `Message from sender:\n${data.message}\n` : ''}

Best regards,
VMG Proposal System Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice #${data.invoiceNumber}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 48px 40px; text-align: center;">
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 28px; font-weight: 300; letter-spacing: 3px; text-transform: uppercase;">
                                Invoice
                            </h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 20px; font-weight: 600;">
                                #${data.invoiceNumber}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 48px 40px;">
                            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hello <strong>${data.clientName}</strong>,
                            </p>
                            
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 24px 0; text-align: center;">
                                <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Amount Due</p>
                                <p style="margin: 0 0 8px 0; color: #047857; font-size: 36px; font-weight: 700;">${formattedAmount}</p>
                                <p style="margin: 0; color: #166534; font-size: 14px;">${dueDateText}</p>
                            </div>

                            ${data.message ? `
                            <div style="background-color: #f9fafb; border-left: 4px solid #059669; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
                                <p style="margin: 0; color: #374151; font-style: italic;">"${data.message}"</p>
                            </div>
                            ` : ''}
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 0 0 16px 0;">
                                        ${data.paymentLink ? `
                                        <a href="${data.paymentLink}" style="display: inline-block; background: linear-gradient(135deg, #059669 0%, #047857 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(5, 150, 105, 0.2);">
                                            Pay Now
                                        </a>
                                        ` : ''}
                                    </td>
                                </tr>
                                <tr>
                                    <td style="text-align: center;">
                                        <a href="${data.viewLink}" style="color: #059669; text-decoration: none; font-size: 14px;">
                                            View Invoice Details →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                                PROPODOCS
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Propodocs. All rights reserved.
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
            const { data: emailData, error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [data.to],
                subject: `Invoice #${data.invoiceNumber} - ${formattedAmount}`,
                text: textContent,
                html: htmlContent,
            });

            if (error) {
                console.error('❌ Resend error:', error);
                throw new Error('Failed to send invoice email');
            }

            console.log(`✅ Invoice email sent to ${data.to} (ID: ${emailData?.id})`);
        } catch (error: any) {
            console.error('❌ Resend error:', error);
            throw new Error('Failed to send invoice email');
        }
    } else {
        console.log('\n📧 ===== INVOICE EMAIL (Resend not configured) =====');
        console.log(`To: ${data.to}`);
        console.log(`Subject: Invoice #${data.invoiceNumber} - ${formattedAmount}`);
        console.log('\n--- Email Content ---');
        console.log(textContent);
        console.log('=====================================================\n');
    }
}

// ===========================================
// CONTRACT EMAIL
// ===========================================

interface ContractEmailData {
    to: string;
    clientName: string;
    contractTitle: string;
    totalValue?: number;
    signingLink: string;
    message?: string;
}

export async function sendContractEmail(data: ContractEmailData): Promise<void> {
    const formattedValue = data.totalValue
        ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data.totalValue)
        : null;

    const textContent = `
Hello ${data.clientName},

You have received a contract "${data.contractTitle}" from Propodocs.
${formattedValue ? `Contract Value: ${formattedValue}` : ''}

Please review and sign the contract using the link below:
${data.signingLink}

${data.message ? `Message from sender:\n${data.message}\n` : ''}

Best regards,
VMG Proposal System Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contract: ${data.contractTitle}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); padding: 48px 40px; text-align: center;">
                            <h1 style="margin: 0 0 8px 0; color: #ffffff; font-size: 24px; font-weight: 300; letter-spacing: 2px;">
                                Contract Ready for Signature
                            </h1>
                            <p style="margin: 0; color: rgba(255, 255, 255, 0.9); font-size: 16px;">
                                ${data.contractTitle}
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 48px 40px;">
                            <p style="margin: 0 0 16px 0; color: #374151; font-size: 16px; line-height: 1.6;">
                                Hello <strong>${data.clientName}</strong>,
                            </p>
                            
                            <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 15px; line-height: 1.6;">
                                A new contract has been prepared for your review and signature.
                            </p>

                            ${formattedValue ? `
                            <div style="background-color: #fef3f2; border: 1px solid #fecaca; border-radius: 12px; padding: 16px 24px; margin: 24px 0; text-align: center;">
                                <p style="margin: 0 0 4px 0; color: #991b1b; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Contract Value</p>
                                <p style="margin: 0; color: #7f1d1d; font-size: 28px; font-weight: 700;">${formattedValue}</p>
                            </div>
                            ` : ''}

                            ${data.message ? `
                            <div style="background-color: #f9fafb; border-left: 4px solid #7A1E1E; padding: 16px; margin-bottom: 32px; border-radius: 4px;">
                                <p style="margin: 0; color: #374151; font-style: italic;">"${data.message}"</p>
                            </div>
                            ` : ''}
                            
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                                <tr>
                                    <td style="text-align: center; padding: 0 0 32px 0;">
                                        <a href="${data.signingLink}" style="display: inline-block; background: linear-gradient(135deg, #7A1E1E 0%, #501010 100%); color: #ffffff; text-decoration: none; padding: 16px 48px; border-radius: 8px; font-size: 16px; font-weight: 600; letter-spacing: 0.5px; box-shadow: 0 4px 6px rgba(122, 30, 30, 0.2);">
                                            Review & Sign Contract
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            
                            <p style="margin: 0; color: #9ca3af; font-size: 13px; text-align: center;">
                                This contract requires your electronic signature.
                            </p>
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                                PROPODOCS
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Propodocs. All rights reserved.
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
            const { data: emailData, error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [data.to],
                subject: `Contract Ready: ${data.contractTitle} - Propodocs`,
                text: textContent,
                html: htmlContent,
            });

            if (error) {
                console.error('❌ Resend error:', error);
                throw new Error('Failed to send contract email');
            }

            console.log(`✅ Contract email sent to ${data.to} (ID: ${emailData?.id})`);
        } catch (error: any) {
            console.error('❌ Resend error:', error);
            throw new Error('Failed to send contract email');
        }
    } else {
        console.log('\n📧 ===== CONTRACT EMAIL (Resend not configured) =====');
        console.log(`To: ${data.to}`);
        console.log(`Subject: Contract Ready: ${data.contractTitle} - Propodocs`);
        console.log('\n--- Email Content ---');
        console.log(textContent);
        console.log('=====================================================\n');
    }
}

// ===========================================
// PAYMENT CONFIRMATION EMAIL
// ===========================================

interface PaymentConfirmationEmailData {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    paymentMethod?: string;
    receiptLink?: string;
}

export async function sendPaymentConfirmationEmail(data: PaymentConfirmationEmailData): Promise<void> {
    const formattedAmount = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
    }).format(data.amount);

    const textContent = `
Hello ${data.clientName},

Thank you for your payment!

Invoice #${data.invoiceNumber}
Amount Paid: ${formattedAmount}
${data.paymentMethod ? `Payment Method: ${data.paymentMethod}` : ''}
${data.receiptLink ? `View Receipt: ${data.receiptLink}` : ''}

Best regards,
VMG Proposal System Team
    `.trim();

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payment Received</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color: #f3f4f6;">
        <tr>
            <td style="padding: 40px 20px;">
                <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
                    <tr>
                        <td style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 48px 40px; text-align: center;">
                            <div style="width: 64px; height: 64px; background: rgba(255,255,255,0.2); border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 16px;">
                                <span style="font-size: 32px;">✓</span>
                            </div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                                Payment Received
                            </h1>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding: 48px 40px; text-align: center;">
                            <p style="margin: 0 0 24px 0; color: #374151; font-size: 16px;">
                                Thank you, <strong>${data.clientName}</strong>!
                            </p>
                            
                            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 24px; margin: 24px 0;">
                                <p style="margin: 0 0 8px 0; color: #166534; font-size: 14px;">Invoice #${data.invoiceNumber}</p>
                                <p style="margin: 0; color: #047857; font-size: 36px; font-weight: 700;">${formattedAmount}</p>
                                ${data.paymentMethod ? `<p style="margin: 8px 0 0 0; color: #6b7280; font-size: 14px;">${data.paymentMethod}</p>` : ''}
                            </div>

                            ${data.receiptLink ? `
                            <a href="${data.receiptLink}" style="color: #059669; text-decoration: none; font-size: 14px;">
                                View Receipt →
                            </a>
                            ` : ''}
                        </td>
                    </tr>
                    <tr>
                        <td style="background-color: #f9fafb; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="margin: 0 0 8px 0; color: #111827; font-size: 14px; font-weight: 600; letter-spacing: 1px;">
                                PROPODOCS
                            </p>
                            <p style="margin: 0; color: #9ca3af; font-size: 12px;">
                                © ${new Date().getFullYear()} Propodocs. All rights reserved.
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
            const { data: emailData, error } = await resend.emails.send({
                from: `${FROM_NAME} <${FROM_EMAIL}>`,
                to: [data.to],
                subject: `Payment Received - Invoice #${data.invoiceNumber}`,
                text: textContent,
                html: htmlContent,
            });

            if (error) {
                console.error('❌ Resend error:', error);
                throw new Error('Failed to send payment confirmation email');
            }

            console.log(`✅ Payment confirmation email sent to ${data.to} (ID: ${emailData?.id})`);
        } catch (error: any) {
            console.error('❌ Resend error:', error);
            throw new Error('Failed to send payment confirmation email');
        }
    } else {
        console.log('\n📧 ===== PAYMENT CONFIRMATION EMAIL (Resend not configured) =====');
        console.log(`To: ${data.to}`);
        console.log(`Subject: Payment Received - Invoice #${data.invoiceNumber}`);
        console.log('\n--- Email Content ---');
        console.log(textContent);
        console.log('=====================================================\n');
    }
}

