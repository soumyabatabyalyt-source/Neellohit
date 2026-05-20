-- Migration: Fix created_by constraint on tasks
-- Date: 2026-05-20
-- Purpose: Allow tasks to be created without explicitly providing created_by

-- Make created_by nullable with default to current user
ALTER TABLE public.tasks
ALTER COLUMN created_by DROP NOT NULL,
ALTER COLUMN created_by SET DEFAULT auth.uid();

-- Update any existing NULL values
UPDATE public.tasks
SET created_by = auth.uid()
WHERE created_by IS NULL;
