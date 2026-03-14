ALTER TABLE public.processed_webhook_events
ADD COLUMN IF NOT EXISTS stripe_session_id text;

CREATE UNIQUE INDEX IF NOT EXISTS processed_webhook_events_stripe_session_uidx
ON public.processed_webhook_events (stripe_session_id)
WHERE stripe_session_id IS NOT NULL;