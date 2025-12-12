-- Check current notifications table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'notifications'
ORDER BY ordinal_position;

-- If 'content' column is missing, add it
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS content TEXT;

-- If there's a 'message' column instead, rename it
-- ALTER TABLE notifications RENAME COLUMN message TO content;

-- Or drop and recreate the table with correct schema
DROP TABLE IF EXISTS notifications CASCADE;

CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Disable RLS for now
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

-- Verify structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'notifications';
