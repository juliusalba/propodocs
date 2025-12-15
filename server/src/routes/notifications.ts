/**
 * Notifications API Routes
 * Handles fetching, marking as read, and preference management
 */

import { Router } from 'express';
import { z } from 'zod';
import supabase from '../db/index.js';
import { authMiddleware, AuthRequest } from '../middleware/auth.js';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

/**
 * GET /notifications
 * Fetch user's notifications with pagination
 */
router.get('/', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const limit = parseInt(req.query.limit as string) || 20;
        const offset = parseInt(req.query.offset as string) || 0;
        const unreadOnly = req.query.unread === 'true';

        let query = supabase
            .from('notifications')
            .select('*', { count: 'exact' })
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (unreadOnly) {
            query = query.eq('is_read', false);
        }

        const { data, count, error } = await query;

        if (error) throw error;

        res.json({
            notifications: data || [],
            total: count || 0,
            unreadCount: unreadOnly ? count : undefined
        });
    } catch (error: any) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

/**
 * GET /notifications/unread-count
 * Get count of unread notifications
 */
router.get('/unread-count', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;

        const { count, error } = await supabase
            .from('notifications')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ count: count || 0 });
    } catch (error: any) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
});

/**
 * PUT /notifications/:id/read
 * Mark a single notification as read
 */
router.put('/:id/read', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const notificationId = parseInt(req.params.id);

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Failed to mark as read' });
    }
});

/**
 * PUT /notifications/read-all
 * Mark all notifications as read
 */
router.put('/read-all', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;

        const { error } = await supabase
            .from('notifications')
            .update({ is_read: true })
            .eq('user_id', userId)
            .eq('is_read', false);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Failed to mark all as read' });
    }
});

/**
 * DELETE /notifications/:id
 * Delete a notification
 */
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const notificationId = parseInt(req.params.id);

        const { error } = await supabase
            .from('notifications')
            .delete()
            .eq('id', notificationId)
            .eq('user_id', userId);

        if (error) throw error;

        res.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Failed to delete notification' });
    }
});

// =============================================
// PREFERENCES
// =============================================

const validEventTypes = [
    'proposal_viewed',
    'proposal_accepted',
    'proposal_rejected',
    'comment_added',
    'contract_signed',
    'contract_updated',
    'invoice_paid',
    'proposal_updated'
];

const validChannels = ['email', 'sms', 'push'];

/**
 * GET /notifications/preferences
 * Get user's notification preferences
 */
router.get('/preferences', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;

        const { data, error } = await supabase
            .from('notification_preferences')
            .select('*')
            .eq('user_id', userId);

        if (error) throw error;

        // Transform to a more usable format
        const preferences: Record<string, Record<string, boolean>> = {};

        for (const pref of data || []) {
            if (!preferences[pref.event_type]) {
                preferences[pref.event_type] = {};
            }
            preferences[pref.event_type][pref.channel] = pref.enabled;
        }

        // Fill in defaults for missing preferences
        for (const eventType of validEventTypes) {
            if (!preferences[eventType]) {
                preferences[eventType] = {};
            }
            for (const channel of validChannels) {
                if (preferences[eventType][channel] === undefined) {
                    // Default: email enabled, others disabled
                    preferences[eventType][channel] = channel === 'email';
                }
            }
        }

        res.json({ preferences });
    } catch (error: any) {
        console.error('Error fetching preferences:', error);
        res.status(500).json({ error: 'Failed to fetch preferences' });
    }
});

/**
 * PUT /notifications/preferences
 * Update notification preferences
 */
const updatePreferencesSchema = z.object({
    preferences: z.record(z.record(z.boolean()))
});

router.put('/preferences', async (req: AuthRequest, res) => {
    try {
        const userId = req.user!.userId;
        const { preferences } = updatePreferencesSchema.parse(req.body);

        // Upsert each preference
        const upserts: any[] = [];
        for (const [eventType, channels] of Object.entries(preferences)) {
            if (!validEventTypes.includes(eventType)) continue;

            for (const [channel, enabled] of Object.entries(channels)) {
                if (!validChannels.includes(channel)) continue;

                upserts.push({
                    user_id: userId,
                    event_type: eventType,
                    channel,
                    enabled,
                    updated_at: new Date().toISOString()
                });
            }
        }

        if (upserts.length > 0) {
            const { error } = await supabase
                .from('notification_preferences')
                .upsert(upserts, { onConflict: 'user_id,channel,event_type' });

            if (error) throw error;
        }

        res.json({ success: true });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            res.status(400).json({ error: 'Invalid input', details: error.errors });
            return;
        }
        console.error('Error updating preferences:', error);
        res.status(500).json({ error: 'Failed to update preferences' });
    }
});

export default router;
