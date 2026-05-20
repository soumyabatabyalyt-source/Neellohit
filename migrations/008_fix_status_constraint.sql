-- Migration: Fix tasks status check constraint
-- Date: 2026-05-20
-- Purpose: Allow 'open' status for published tasks

ALTER TABLE public.tasks
DROP CONSTRAINT IF EXISTS tasks_status_check;

ALTER TABLE public.tasks
ADD CONSTRAINT tasks_status_check
CHECK (status IN ('draft', 'open', 'available', 'claimed', 'completed', 'expired', 'rejected'));
