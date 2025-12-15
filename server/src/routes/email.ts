import express from 'express';
import { Resend } from 'resend';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();
const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/send', async (req, res) => {
    try {
        const { to, subject, html, text } = req.body;

        if (!process.env.RESEND_API_KEY) {
            console.warn('RESEND_API_KEY is not set. Mocking email send.');
            // Simulate delay
            await new Promise(resolve => setTimeout(resolve, 1000));
            return res.json({
                success: true,
                message: 'Email mocked (API key missing)',
                id: 'mock-id-' + Date.now()
            });
        }

        const data = await resend.emails.send({
            from: `${process.env.FROM_NAME || 'Propodocs'} <${process.env.FROM_EMAIL || 'onboarding@resend.dev'}>`,
            to,
            subject,
            html,
            text
        });

        res.json({ success: true, data });
    } catch (error: any) {
        console.error('Error sending email:', error);
        res.status(500).json({ error: 'Failed to send email', details: error.message });
    }
});

export default router;
