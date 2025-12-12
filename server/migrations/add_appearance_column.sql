-- Add appearance column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS appearance JSONB DEFAULT '{"theme": "light", "accentColor": "#8C0000"}';
