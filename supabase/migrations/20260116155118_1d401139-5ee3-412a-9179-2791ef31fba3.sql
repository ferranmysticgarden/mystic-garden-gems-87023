-- Add daily streak tracking columns to game_progress table
ALTER TABLE public.game_progress 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_login_date DATE,
ADD COLUMN IF NOT EXISTS streak_claimed_today BOOLEAN DEFAULT FALSE;

-- Create index for faster queries on login date
CREATE INDEX IF NOT EXISTS idx_game_progress_last_login ON public.game_progress(last_login_date);

-- Comment for documentation
COMMENT ON COLUMN public.game_progress.current_streak IS 'Current consecutive days logged in';
COMMENT ON COLUMN public.game_progress.max_streak IS 'Maximum streak ever achieved';
COMMENT ON COLUMN public.game_progress.last_login_date IS 'Last date user logged in (for streak calculation)';
COMMENT ON COLUMN public.game_progress.streak_claimed_today IS 'Whether daily streak reward was claimed today';