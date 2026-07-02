ALTER TABLE public.game_progress
ADD COLUMN IF NOT EXISTS stars_earned jsonb NOT NULL DEFAULT '{}'::jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_progress TO authenticated;
GRANT ALL ON public.game_progress TO service_role;