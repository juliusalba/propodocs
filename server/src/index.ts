import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import proposalRoutes from './routes/proposals.js';
import linkRoutes from './routes/links.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import templateRoutes from './routes/templates.js';
import uploadRoutes from './routes/upload.js';
import emailRoutes from './routes/email.js';
import pdfRoutes from './routes/pdf.js';
import calculatorRoutes from './routes/calculators.js';
import uploadsRoutes from './routes/uploads.js';
import invoiceRoutes from './routes/invoices.js';
import contractRoutes from './routes/contracts.js';
import contractTemplateRoutes from './routes/contract-templates.js';
import paymentRoutes from './routes/payments.js';
import clientRoutes from './routes/clients.js';
import notificationRoutes from './routes/notifications.js';
import path from 'path';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            'http://localhost:5173',
            'http://localhost:3000',
            'http://localhost:4000',
            'https://propodocs.vercel.app',
            'https://propodocs.online',
            'https://www.propodocs.online',
            process.env.FRONTEND_URL
        ].filter(Boolean);

        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        // Allow any Vercel preview deployment
        if (origin.includes('vercel.app')) {
            return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
const jsonParser = express.json({ limit: '10mb' });
app.use((req, res, next) => {
    // Keep raw body intact for Stripe webhook verification.
    if (req.originalUrl.startsWith('/api/payments/webhook')) {
        return next();
    }
    return jsonParser(req, res, next);
});

// Logging middleware
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Propodocs Server is running',
        timestamp: new Date().toISOString(),
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/proposals', proposalRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/calculators', calculatorRoutes);
app.use('/api/uploads', uploadsRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/contracts', contractRoutes);
app.use('/api/contract-templates', contractTemplateRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/pdf', pdfRoutes);
app.use('/', pdfRoutes);

// Serve uploaded files
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));



// Error handling middleware
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    void req;
    void next;
    const typedError = err as { status?: number; message?: string };
    console.error('Error:', err);
    res.status(typedError.status || 500).json({
        error: typedError.message || 'Internal server error',
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Not found' });
});

// Start server
app.listen(PORT, () => {
    console.log(`\n✅ Propodocs Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down gracefully...');
    process.exit(0);
});
