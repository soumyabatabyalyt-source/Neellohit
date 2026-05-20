-- Migration: Add foreign key constraint to task_claims
-- Date: 2026-05-20
-- Purpose: Ensure referential integrity between task_claims and tasks

-- First, check if constraint already exists
-- If it does, this will fail but that's okay

ALTER TABLE public.task_claims
ADD CONSTRAINT task_claims_task_id_fkey
FOREIGN KEY (task_id) REFERENCES public.tasks(id)
ON DELETE CASCADE
ON UPDATE CASCADE;

-- If the above fails because the constraint already exists,
-- you can check existing constraints with:
-- SELECT constraint_name FROM information_schema.table_constraints
-- WHERE table_name = 'task_claims';
