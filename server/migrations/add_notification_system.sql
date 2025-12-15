-- ===========================================
-- MIGRATION: Add Notification System
-- Run this in Supabase SQL Editor
-- ===========================================

-- 1. User Notification Preferences
-- Stores per-user, per-channel, per-event preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'push')),
    event_type VARCHAR(50) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, channel, event_type)
);

-- 2. Notifications Log
-- Stores all notifications sent to users
CREATE TABLE IF NOT EXISTS notifications (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT,
    data JSONB,
    link VARCHAR(500),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add phone number to users for SMS notifications
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone VARCHAR(20);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- 5. Insert default preferences for existing users
-- This sets email notifications ON by default for key events
INSERT INTO notification_preferences (user_id, channel, event_type, enabled)
SELECT u.id, 'email', event_type, true
FROM users u
CROSS JOIN (VALUES 
    ('proposal_viewed'),
    ('proposal_accepted'),
    ('proposal_rejected'),
    ('comment_added'),
    ('contract_signed'),
    ('invoice_paid'),
    ('proposal_updated')
) AS events(event_type)
ON CONFLICT (user_id, channel, event_type) DO NOTHING;

-- Comments
COMMENT ON TABLE notification_preferences IS 'User preferences for notification channels and event types';
COMMENT ON TABLE notifications IS 'Log of all notifications sent to users';
COMMENT ON COLUMN notifications.type IS 'Event type: proposal_viewed, proposal_accepted, comment_added, etc.';
COMMENT ON COLUMN notifications.data IS 'JSON payload with context (proposal_id, client_name, etc.)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Notification system tables created successfully!';
END $$;
