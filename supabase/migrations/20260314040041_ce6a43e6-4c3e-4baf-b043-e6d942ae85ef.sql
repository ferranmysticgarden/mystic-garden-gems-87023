CREATE TABLE IF NOT EXISTS public.processed_webhook_events (
  id text PRIMARY KEY,
  product_id text NOT NULL,
  user_id uuid NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.processed_webhook_events ENABLE ROW LEVEL SECURITY;

-- No public access needed - only service_role writes from edge functions
CREATE POLICY "No public access" ON public.processed_webhook_events
  FOR ALL TO anon, authenticated
  USING (false);