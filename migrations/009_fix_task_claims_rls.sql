-- Migration: Fix RLS on task_claims table
-- Date: 2026-05-20
-- Purpose: Allow users to see their own claimed tasks

ALTER TABLE public.task_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "task_claims_select_own" ON public.task_claims;
DROP POLICY IF EXISTS "task_claims_insert_own" ON public.task_claims;
DROP POLICY IF EXISTS "task_claims_update_own" ON public.task_claims;

-- Users can read their own claims
CREATE POLICY "task_claims_select_own"
ON public.task_claims
FOR SELECT
USING (auth.uid() = user_id OR auth.role() = 'service_role');

-- Users can insert their own claims (handled by backend)
CREATE POLICY "task_claims_insert_own"
ON public.task_claims
FOR INSERT
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');

-- Users can update their own claims (handled by backend)
CREATE POLICY "task_claims_update_own"
ON public.task_claims
FOR UPDATE
USING (auth.uid() = user_id OR auth.role() = 'service_role')
WITH CHECK (auth.uid() = user_id OR auth.role() = 'service_role');
