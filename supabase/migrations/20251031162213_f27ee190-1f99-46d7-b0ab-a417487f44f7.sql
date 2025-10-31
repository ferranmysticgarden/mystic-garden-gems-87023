-- Create game_progress table to store player progress
CREATE TABLE public.game_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  lives INTEGER NOT NULL DEFAULT 5,
  gems INTEGER NOT NULL DEFAULT 0,
  current_level INTEGER NOT NULL DEFAULT 1,
  completed_levels INTEGER[] NOT NULL DEFAULT '{}',
  unlimited_lives_until TIMESTAMP WITH TIME ZONE,
  hammer_count INTEGER NOT NULL DEFAULT 3,
  undo_count INTEGER NOT NULL DEFAULT 0,
  shuffle_count INTEGER NOT NULL DEFAULT 0,
  last_life_refill TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own progress"
ON public.game_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own progress"
ON public.game_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own progress"
ON public.game_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_game_progress_updated_at
BEFORE UPDATE ON public.game_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to initialize game progress for new users
CREATE OR REPLACE FUNCTION public.initialize_game_progress()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.game_progress (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$;

-- Trigger to auto-create game progress when profile is created
CREATE TRIGGER on_profile_created_init_game
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.initialize_game_progress();