-- Migration: Fix task_code constraint
-- Date: 2026-05-20
-- Purpose: Allow flexible task codes and auto-generate if not provided

-- Drop the strict check constraint
ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS chk_task_code_format;

-- Make task_code optional with auto-generated value
ALTER TABLE public.tasks
ALTER COLUMN task_code DROP NOT NULL,
ALTER COLUMN task_code SET DEFAULT ('TASK-' || to_char(now(), 'YYMMDDHHmmss'));

-- Add a new, more lenient constraint if needed
ALTER TABLE public.tasks
ADD CONSTRAINT chk_task_code_not_empty
CHECK (task_code IS NULL OR task_code != '');
