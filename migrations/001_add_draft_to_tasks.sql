-- Migration: Add draft and approval_status columns to tasks table
-- Date: 2026-05-20
-- Purpose:
--   1. Support draft tasks for spreadsheet import workflow
--   2. Track task approval status with rejection reasons

-- 1. Add draft column
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS draft boolean NOT NULL DEFAULT false;

-- 2. Add approval_status column
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS approval_status text DEFAULT 'pending';

-- 3. Add rejection_reason column (for tracking why tasks were rejected)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS rejection_reason text;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_draft_status
ON public.tasks(draft, status);

CREATE INDEX IF NOT EXISTS idx_tasks_approval_status
ON public.tasks(approval_status);

-- Add comments to document the columns
COMMENT ON COLUMN public.tasks.draft
IS 'When true, task is a draft from spreadsheet import. When false, task is published to task pool.';

COMMENT ON COLUMN public.tasks.approval_status
IS 'Status of task approval: pending, approved, rejected, filtered, mod_removed, etc. Tracked separately from claim status.';

COMMENT ON COLUMN public.tasks.rejection_reason
IS 'Reason why task was rejected/filtered (e.g., "Filtered", "Mod Removed", "Rule Violation", etc.)';
