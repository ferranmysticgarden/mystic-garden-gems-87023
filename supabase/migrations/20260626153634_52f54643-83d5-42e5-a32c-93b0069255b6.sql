CREATE POLICY "themes_no_client_inserts" ON public.user_themes
  FOR INSERT TO authenticated WITH CHECK (false);

CREATE POLICY "themes_no_client_updates" ON public.user_themes
  FOR UPDATE TO authenticated USING (false) WITH CHECK (false);

CREATE POLICY "themes_no_client_deletes" ON public.user_themes
  FOR DELETE TO authenticated USING (false);