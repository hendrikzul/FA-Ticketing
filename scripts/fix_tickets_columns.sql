-- ============================================
-- AICOP UAT: Fix missing columns on tickets table
-- Run: psql -U <user> -d aicop -f scripts/fix_tickets_columns.sql
-- ============================================

-- Add ticket_type column (nullable, after description)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ticket_type VARCHAR(255);

-- Add is_draft column (default true, after status)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT true;

-- Add approval_required column (default false, after is_draft)
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS approval_required BOOLEAN DEFAULT false;

-- Create index on ticket_type
CREATE INDEX IF NOT EXISTS idx_tickets_ticket_type ON tickets(ticket_type);

-- Verify
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tickets'
  AND column_name IN ('ticket_type', 'is_draft', 'approval_required')
ORDER BY ordinal_position;
