CREATE TYPE public.theme_unlock_method AS ENUM ('level', 'purchase', 'gems');

CREATE TABLE public.user_themes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  theme_id TEXT NOT NULL,
  unlocked_method public.theme_unlock_method NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  level_at_unlock INTEGER,
  CONSTRAINT user_themes_owner_xor CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  ),
  CONSTRAINT user_themes_theme_valid CHECK (
    theme_id IN ('animals','desserts','fruits','racing','pirates','unicorns','manga')
  )
);

CREATE UNIQUE INDEX user_themes_user_theme_uniq
  ON public.user_themes(user_id, theme_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX user_themes_guest_theme_uniq
  ON public.user_themes(guest_session_id, theme_id) WHERE guest_session_id IS NOT NULL;

GRANT SELECT ON public.user_themes TO authenticated;
GRANT ALL    ON public.user_themes TO service_role;

ALTER TABLE public.user_themes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own themes"
  ON public.user_themes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
