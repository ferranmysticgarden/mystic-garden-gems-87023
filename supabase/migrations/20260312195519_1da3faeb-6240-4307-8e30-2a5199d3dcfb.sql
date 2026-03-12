-- Harden RLS for monetization-critical tables

-- 1) Prevent clients from self-granting purchases
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_purchases;

-- 2) Require authenticated users for progress access and enforce WITH CHECK on updates
DROP POLICY IF EXISTS "Users can view their own progress" ON public.game_progress;
DROP POLICY IF EXISTS "Users can insert their own progress" ON public.game_progress;
DROP POLICY IF EXISTS "Users can update their own progress" ON public.game_progress;

CREATE POLICY "Users can view their own progress"
ON public.game_progress
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.game_progress
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.game_progress
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);