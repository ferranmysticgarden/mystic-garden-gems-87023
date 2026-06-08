
-- #3: Make processed_webhook_events deny RESTRICTIVE
DROP POLICY IF EXISTS "No public access" ON public.processed_webhook_events;
CREATE POLICY "No public access (restrictive)"
  ON public.processed_webhook_events
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);

-- Option B: guard monetized columns + gem inflation on game_progress
CREATE OR REPLACE FUNCTION public.guard_game_progress_client_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  -- service_role bypass: edge functions and admin tools have full access
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  IF jwt_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block client changes to monetized columns
  IF NEW.unlimited_lives_until IS DISTINCT FROM OLD.unlimited_lives_until THEN
    RAISE EXCEPTION 'unlimited_lives_until can only be modified by the server'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.no_ads_until IS DISTINCT FROM OLD.no_ads_until THEN
    RAISE EXCEPTION 'no_ads_until can only be modified by the server'
      USING ERRCODE = '42501';
  END IF;

  -- Block large gem deltas from client (purchases come via edge function)
  IF NEW.gems IS DISTINCT FROM OLD.gems
     AND (NEW.gems - COALESCE(OLD.gems, 0)) > 500 THEN
    RAISE EXCEPTION 'Gem increases over 500 must be processed server-side'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_game_progress_client_updates ON public.game_progress;
CREATE TRIGGER guard_game_progress_client_updates
  BEFORE UPDATE ON public.game_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_game_progress_client_updates();
