-- Harden app_events INSERT policy (replace permissive WITH CHECK true)
DROP POLICY IF EXISTS "Anyone can insert events" ON public.app_events;

CREATE POLICY "Anyone can insert events"
ON public.app_events
FOR INSERT
TO anon, authenticated
WITH CHECK (
  event_name IS NOT NULL
  AND length(btrim(event_name)) > 0
  AND length(event_name) <= 120
);