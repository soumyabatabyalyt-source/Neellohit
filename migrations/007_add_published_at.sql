-- Migration: Add published_at column to tasks
-- Date: 2026-05-20
-- Purpose: Track when tasks were published

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS published_at timestamp with time zone;

-- Update existing published tasks
UPDATE public.tasks
SET published_at = created_at
WHERE draft = false AND published_at IS NULL;
