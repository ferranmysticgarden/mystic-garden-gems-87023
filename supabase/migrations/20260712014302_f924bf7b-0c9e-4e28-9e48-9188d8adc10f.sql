
-- Personal referral code per user
CREATE TABLE public.referral_codes (
  user_id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.referral_codes TO authenticated;
GRANT ALL ON public.referral_codes TO service_role;

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own referral code"
  ON public.referral_codes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users create own referral code"
  ON public.referral_codes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Referrals: one row per invited friend
CREATE TABLE public.referrals (
  id UUID NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'redeemed',
  redeemed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  qualified_at TIMESTAMPTZ,
  referrer_rewarded_at TIMESTAMPTZ,
  referred_rewarded_at TIMESTAMPTZ,
  referrer_gems_granted INT NOT NULL DEFAULT 0,
  referred_gems_granted INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (referrer_user_id <> referred_user_id),
  CHECK (status IN ('redeemed','qualified','rewarded'))
);

CREATE INDEX idx_referrals_referrer ON public.referrals(referrer_user_id);
CREATE INDEX idx_referrals_status ON public.referrals(status);

GRANT SELECT ON public.referrals TO authenticated;
GRANT ALL ON public.referrals TO service_role;

ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Users can view referrals they made or received
CREATE POLICY "Users view own referrals"
  ON public.referrals FOR SELECT TO authenticated
  USING (auth.uid() = referrer_user_id OR auth.uid() = referred_user_id);

-- No client INSERT/UPDATE/DELETE: all writes go through edge functions (service_role)

CREATE TRIGGER update_referrals_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
