
-- ============================================================
-- TABLE: piggy_bank
-- ============================================================
CREATE TABLE public.piggy_bank (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  current_amount INTEGER NOT NULL DEFAULT 0,
  is_unlocked BOOLEAN NOT NULL DEFAULT false,
  unlocked_at TIMESTAMPTZ,
  last_deposit_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT piggy_bank_owner_check CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  ),
  CONSTRAINT piggy_bank_amount_range CHECK (current_amount >= 0 AND current_amount <= 300)
);

CREATE UNIQUE INDEX piggy_bank_user_id_uidx ON public.piggy_bank(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX piggy_bank_guest_id_uidx ON public.piggy_bank(guest_session_id) WHERE guest_session_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.piggy_bank TO authenticated;
GRANT ALL ON public.piggy_bank TO service_role;

ALTER TABLE public.piggy_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own piggy bank"
  ON public.piggy_bank FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own piggy bank"
  ON public.piggy_bank FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own piggy bank deposits"
  ON public.piggy_bank FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to block client-side unlock (only service_role can unlock)
CREATE OR REPLACE FUNCTION public.guard_piggy_bank_client_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  IF jwt_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block client from setting unlocked state
  IF NEW.is_unlocked IS DISTINCT FROM OLD.is_unlocked THEN
    RAISE EXCEPTION 'is_unlocked can only be modified by the server' USING ERRCODE = '42501';
  END IF;
  IF NEW.unlocked_at IS DISTINCT FROM OLD.unlocked_at THEN
    RAISE EXCEPTION 'unlocked_at can only be modified by the server' USING ERRCODE = '42501';
  END IF;

  -- Limit client deposits to small increments (anti-cheat)
  IF NEW.current_amount IS DISTINCT FROM OLD.current_amount
     AND (NEW.current_amount - COALESCE(OLD.current_amount, 0)) > 10 THEN
    RAISE EXCEPTION 'Piggy bank deposit increments over 10 must be processed server-side' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER piggy_bank_guard_client_updates
  BEFORE UPDATE ON public.piggy_bank
  FOR EACH ROW EXECUTE FUNCTION public.guard_piggy_bank_client_updates();

CREATE TRIGGER piggy_bank_updated_at
  BEFORE UPDATE ON public.piggy_bank
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TABLE: season_passes
-- ============================================================
CREATE TABLE public.season_passes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  guest_session_id TEXT,
  season_id TEXT NOT NULL,
  progress_points INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  premium_purchased_at TIMESTAMPTZ,
  claimed_tiers INTEGER[] NOT NULL DEFAULT ARRAY[]::INTEGER[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT season_passes_owner_check CHECK (
    (user_id IS NOT NULL AND guest_session_id IS NULL) OR
    (user_id IS NULL AND guest_session_id IS NOT NULL)
  ),
  CONSTRAINT season_passes_points_range CHECK (progress_points >= 0)
);

CREATE UNIQUE INDEX season_passes_user_season_uidx
  ON public.season_passes(user_id, season_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX season_passes_guest_season_uidx
  ON public.season_passes(guest_session_id, season_id) WHERE guest_session_id IS NOT NULL;

GRANT SELECT, INSERT, UPDATE ON public.season_passes TO authenticated;
GRANT ALL ON public.season_passes TO service_role;

ALTER TABLE public.season_passes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own season pass"
  ON public.season_passes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own season pass"
  ON public.season_passes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own season pass progress"
  ON public.season_passes FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to block client-side premium activation and tier claims
CREATE OR REPLACE FUNCTION public.guard_season_passes_client_updates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  jwt_role text;
BEGIN
  BEGIN
    jwt_role := current_setting('request.jwt.claim.role', true);
  EXCEPTION WHEN OTHERS THEN
    jwt_role := NULL;
  END;

  IF jwt_role = 'service_role' OR current_user = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Block client from activating premium
  IF NEW.is_premium IS DISTINCT FROM OLD.is_premium THEN
    RAISE EXCEPTION 'is_premium can only be modified by the server' USING ERRCODE = '42501';
  END IF;
  IF NEW.premium_purchased_at IS DISTINCT FROM OLD.premium_purchased_at THEN
    RAISE EXCEPTION 'premium_purchased_at can only be modified by the server' USING ERRCODE = '42501';
  END IF;

  -- Block client from modifying claimed_tiers (server-only via claim-season-tier)
  IF NEW.claimed_tiers IS DISTINCT FROM OLD.claimed_tiers THEN
    RAISE EXCEPTION 'claimed_tiers can only be modified by the server' USING ERRCODE = '42501';
  END IF;

  -- Limit client progress increments (anti-cheat: max +50 points per update)
  IF NEW.progress_points IS DISTINCT FROM OLD.progress_points
     AND (NEW.progress_points - COALESCE(OLD.progress_points, 0)) > 50 THEN
    RAISE EXCEPTION 'Progress increments over 50 must be processed server-side' USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER season_passes_guard_client_updates
  BEFORE UPDATE ON public.season_passes
  FOR EACH ROW EXECUTE FUNCTION public.guard_season_passes_client_updates();

CREATE TRIGGER season_passes_updated_at
  BEFORE UPDATE ON public.season_passes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
