import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import supabase from '../db/index.js';
import { generateToken, authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

const registerSchema = z.object({
    email: z.string().email(),
    password: z.string().min(8),
    name: z.string().min(1),
    company: z.string().optional(),
});

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string(),
});

// Register
router.post('/register', async (req, res) => {
    try {
        const data = registerSchema.parse(req.body);

        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('email', data.email)
            .single();

        if (existingUser) {
            res.status(400).json({ error: 'Email already registered' });
            return;
        }

        // Hash password (8 rounds = fast but still secure)
        const passwordHash = await bcrypt.hash(data.password, 8);

        // Create user
        const { data: newUser, error } = await supabase
            .from('users')
            .insert({
                email: data.email,
                password: passwordHash, // Note: Storing hashed password in our users table
                name: data.name,
                company: data.company || null,
            })
            .select()
            .single();

        if (error || !newUser) {
            throw error || new Error('Failed to create user');
        }

        // Generate token
        const token = generateToken({ userId: newUser.id, email: newUser.email });

        res.status(201).json({
            token,
            user: {
                id: newUser.id,
                email: newUser.email,
                name: newUser.name,
                company: newUser.company,
                logo_url: newUser.logo_url,
                signature_url: newUser.signature_url,
                avatar_url: newUser.avatar_url,
                bank_details: newUser.bank_details,
                payment_preferences: newUser.payment_preferences
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// Login
router.post('/login', async (req, res) => {
    try {
        const data = loginSchema.parse(req.body);

        // Find user
        const { data: user } = await supabase
            .from('users')
            .select('*')
            .eq('email', data.email)
            .single();

        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Verify password
        // Note: We are using our own password hashing, not Supabase Auth's password
        const isValid = await bcrypt.compare(data.password, user.password); // Schema uses 'password' column for hash
        if (!isValid) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }

        // Generate token
        const token = generateToken({ userId: user.id, email: user.email });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                company: user.company,
                logo_url: user.logo_url,
                signature_url: user.signature_url,
                avatar_url: user.avatar_url,
                bank_details: user.bank_details,
                payment_preferences: user.payment_preferences
            },
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Get current user
router.get('/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, company, signature_url, logo_url, avatar_url, bank_details, payment_preferences, created_at')
            .eq('id', req.user!.userId)
            .single();

        if (error || !user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        res.json({ user });
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ error: 'Failed to get user' });
    }
});

// Refresh Token - Extend session
router.post('/refresh', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('id, email, name, company, signature_url, logo_url, avatar_url, bank_details, payment_preferences, created_at')
            .eq('id', req.user!.userId)
            .single();

        if (error || !user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Generate NEW token
        const token = generateToken({ userId: user.id, email: user.email });

        res.json({ user, token });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(500).json({ error: 'Failed to refresh token' });
    }
});

// Update user profile
router.put('/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
        const updateSchema = z.object({
            name: z.string().min(1).optional(),
            company: z.string().optional(),
            signature_url: z.string().optional(),
            logo_url: z.string().optional(),
            avatar_url: z.string().optional(),
            bank_details: z.record(z.any()).optional(),
            payment_preferences: z.record(z.any()).optional(),
            appearance: z.record(z.any()).optional(),
        });

        const data = updateSchema.parse(req.body);
        const userId = req.user!.userId;

        const { data: updatedUser, error } = await supabase
            .from('users')
            .update({
                ...data,
                updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select('id, email, name, company, signature_url, logo_url, avatar_url, bank_details, payment_preferences, appearance')
            .single();

        if (error || !updatedUser) {
            throw error || new Error('Failed to update profile');
        }

        res.json({ user: updatedUser });
    } catch (error) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Logout
router.post('/logout', authMiddleware, (req, res) => {
    res.json({ message: 'Logged out successfully' });
});

// Forgot Password - Request password reset
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            res.status(400).json({ error: 'Email is required' });
            return;
        }

        // Find user by email
        const { data: user } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('email', email)
            .single();

        // Always return success even if user doesn't exist (security best practice)
        if (!user) {
            res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
            return;
        }

        // Generate secure random token
        const crypto = await import('crypto');
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Token expires in 1 hour
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        // Store token in database
        const { error: tokenError } = await supabase
            .from('password_reset_tokens')
            .insert({
                user_id: user.id,
                token: resetToken,
                expires_at: expiresAt.toISOString(),
            });

        if (tokenError) {
            console.error('Error creating reset token:', tokenError);
            res.status(500).json({ error: 'Failed to process password reset request' });
            return;
        }

        // Send password reset email
        const { sendPasswordResetEmail } = await import('../utils/email.js');
        try {
            await sendPasswordResetEmail({
                to: user.email,
                name: user.name,
                resetToken,
            });
        } catch (emailError) {
            console.error('Error sending reset email:', emailError);
            // Don't fail the request if email fails - token is still valid
        }

        res.json({ message: 'If an account exists with this email, a password reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Failed to process password reset request' });
    }
});

// Reset Password - Verify token and update password
router.post('/reset-password', async (req, res) => {
    try {
        const { token, password } = req.body;

        if (!token || !password) {
            res.status(400).json({ error: 'Token and password are required' });
            return;
        }

        if (password.length < 8) {
            res.status(400).json({ error: 'Password must be at least 8 characters long' });
            return;
        }

        // Find valid token
        const { data: resetToken } = await supabase
            .from('password_reset_tokens')
            .select('*')
            .eq('token', token)
            .is('used_at', null)
            .single();

        if (!resetToken) {
            res.status(400).json({ error: 'Invalid or expired reset token' });
            return;
        }

        // Check if token is expired
        const now = new Date();
        const expiresAt = new Date(resetToken.expires_at);
        if (now > expiresAt) {
            res.status(400).json({ error: 'Reset token has expired' });
            return;
        }

        // Hash new password (8 rounds = fast but still secure)
        const passwordHash = await bcrypt.hash(password, 8);

        // Update user password
        const { error: updateError } = await supabase
            .from('users')
            .update({ password: passwordHash, updated_at: new Date().toISOString() })
            .eq('id', resetToken.user_id);

        if (updateError) {
            console.error('Error updating password:', updateError);
            res.status(500).json({ error: 'Failed to reset password' });
            return;
        }

        // Mark token as used
        await supabase
            .from('password_reset_tokens')
            .update({ used_at: new Date().toISOString() })
            .eq('id', resetToken.id);

        res.json({ message: 'Password has been reset successfully' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Failed to reset password' });
    }
});

// Google OAuth
router.get('/google', (req, res) => {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
    const REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

    if (!GOOGLE_CLIENT_ID) {
        return res.status(500).json({ error: 'Google Auth not configured' });
    }

    const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        response_type: 'code',
        scope: 'email profile',
        access_type: 'offline',
        prompt: 'consent'
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
});

router.get('/google/callback', async (req, res) => {
    try {
        const { code } = req.query;
        const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
        const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
        const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        const REDIRECT_URI = `${BACKEND_URL}/api/auth/google/callback`;

        if (!code || !GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
            return res.redirect(`${FRONTEND_URL}/login?error=google_config_error`);
        }

        // 1. Exchange code for tokens
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                client_id: GOOGLE_CLIENT_ID,
                client_secret: GOOGLE_CLIENT_SECRET,
                code,
                grant_type: 'authorization_code',
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenResponse.json() as any;

        if (!tokenData.access_token) {
            console.error('Failed to get access token:', tokenData);
            return res.redirect(`${FRONTEND_URL}/login?error=token_exchange_failed`);
        }

        // 2. Get user info
        const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const userData = await userResponse.json() as any;

        if (!userData.email) {
            return res.redirect(`${FRONTEND_URL}/login?error=no_email`);
        }

        // 3. Find or Create User
        // Check if user exists
        const { data: existingUser } = await supabase
            .from('users')
            .select('*')
            .eq('email', userData.email)
            .single();

        let userId = existingUser?.id;

        if (!existingUser) {
            // Create new user with random password (since they use Google)
            const crypto = await import('crypto');
            const randomPassword = crypto.randomBytes(16).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            const { data: newUser, error: createError } = await supabase
                .from('users')
                .insert({
                    email: userData.email,
                    name: userData.name || userData.email.split('@')[0],
                    password: hashedPassword,
                    avatar_url: userData.picture,
                    company: null
                })
                .select()
                .single();

            if (createError || !newUser) {
                console.error('Error creating user:', createError);
                return res.redirect(`${FRONTEND_URL}/login?error=creation_failed`);
            }
            userId = newUser.id;
        } else {
            // Update avatar if not set
            if (!existingUser.avatar_url && userData.picture) {
                await supabase
                    .from('users')
                    .update({ avatar_url: userData.picture })
                    .eq('id', userId);
            }
        }

        // 4. Generate Token
        const token = generateToken({ userId, email: userData.email });

        // 5. Redirect to frontend with token
        res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}`);

    } catch (error) {
        console.error('Google callback error:', error);
        const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
        res.redirect(`${FRONTEND_URL}/login?error=server_error`);
    }
});

export default router;
