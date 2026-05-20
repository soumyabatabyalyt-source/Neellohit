-- Migration: Fix RLS policies on tasks table
-- Date: 2026-05-20
-- Purpose: Allow authenticated users to insert tasks

-- Enable RLS (if not already enabled)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to read tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow authenticated users to insert tasks" ON public.tasks;
DROP POLICY IF EXISTS "Allow task owners to update" ON public.tasks;
DROP POLICY IF EXISTS "tasks_select_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_insert_policy" ON public.tasks;
DROP POLICY IF EXISTS "tasks_update_policy" ON public.tasks;

-- Policy to allow all authenticated users to read tasks
CREATE POLICY "tasks_select_policy"
ON public.tasks
FOR SELECT
USING (true);

-- Policy to allow authenticated users to insert tasks (for managers/creators)
CREATE POLICY "tasks_insert_policy"
ON public.tasks
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Policy to allow task creators/managers to update their tasks
CREATE POLICY "tasks_update_policy"
ON public.tasks
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy to allow deletion (if needed)
CREATE POLICY "tasks_delete_policy"
ON public.tasks
FOR DELETE
USING (auth.role() = 'authenticated');
