
CREATE TABLE public.app_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_name text NOT NULL,
  event_data jsonb DEFAULT '{}',
  platform text DEFAULT 'unknown',
  device_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- No RLS - these are anonymous analytics events, no PII
ALTER TABLE public.app_events ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT (anonymous tracking)
CREATE POLICY "Anyone can insert events"
  ON public.app_events FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can read
CREATE POLICY "Admins can read events"
  ON public.app_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
