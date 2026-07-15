-- 1) Drop duplicate trigger (keeps guard_game_progress_client_updates)
DROP TRIGGER IF EXISTS guard_game_progress_client_updates_trg ON public.game_progress;

-- 2) Harden the guard: recognize service_role via JWT claims JSON, JWT single-claim GUC, current_user, and session_user
CREATE OR REPLACE FUNCTION public.guard_game_progress_client_updates()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  jwt_role text;
  jwt_claims_json text;
BEGIN
  -- Try JSON claims (PostgREST v10+)
  BEGIN
    jwt_claims_json := current_setting('request.jwt.claims', true);
    IF jwt_claims_json IS NOT NULL AND jwt_claims_json <> '' THEN
      jwt_role := (jwt_claims_json::json ->> 'role');
    END IF;
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  -- Fallback: legacy single-claim GUC
  IF jwt_role IS NULL THEN
    BEGIN
      jwt_role := current_setting('request.jwt.claim.role', true);
    EXCEPTION WHEN OTHERS THEN
      jwt_role := NULL;
    END;
  END IF;

  -- Bypass for any server-side execution path
  IF jwt_role = 'service_role'
     OR current_user IN ('service_role', 'supabase_admin', 'postgres')
     OR session_user IN ('service_role', 'supabase_admin', 'postgres') THEN
    RETURN NEW;
  END IF;

  -- Client-facing restrictions (unchanged)
  IF NEW.unlimited_lives_until IS DISTINCT FROM OLD.unlimited_lives_until THEN
    RAISE EXCEPTION 'unlimited_lives_until can only be modified by the server'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.no_ads_until IS DISTINCT FROM OLD.no_ads_until THEN
    RAISE EXCEPTION 'no_ads_until can only be modified by the server'
      USING ERRCODE = '42501';
  END IF;

  IF NEW.gems IS DISTINCT FROM OLD.gems
     AND (NEW.gems - COALESCE(OLD.gems, 0)) > 500 THEN
    RAISE EXCEPTION 'Gem increases over 500 must be processed server-side'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$function$;