ALTER TABLE public.game_progress
ADD COLUMN IF NOT EXISTS no_ads_until timestamptz;

CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  event_id text PRIMARY KEY,
  stripe_session_id text,
  event_type text NOT NULL,
  user_id uuid,
  product_id text,
  status text NOT NULL DEFAULT 'processing',
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz
);

CREATE INDEX IF NOT EXISTS processed_webhook_events_session_idx
  ON public.processed_webhook_events (stripe_session_id);
