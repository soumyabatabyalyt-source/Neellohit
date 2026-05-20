-- Migration: Add reward column to tasks table
-- Date: 2026-05-20
-- Purpose: Track task reward amount

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS reward numeric(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_tasks_reward
ON public.tasks(reward);

COMMENT ON COLUMN public.tasks.reward
IS 'Reward amount in USD for completing the task';
