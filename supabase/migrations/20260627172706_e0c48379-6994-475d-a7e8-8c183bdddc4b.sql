
-- 1) Wire guard trigger for season_passes (function already exists)
DROP TRIGGER IF EXISTS guard_season_passes_client_updates_trg ON public.season_passes;
CREATE TRIGGER guard_season_passes_client_updates_trg
BEFORE UPDATE ON public.season_passes
FOR EACH ROW EXECUTE FUNCTION public.guard_season_passes_client_updates();

-- Also wire the existing guard functions for game_progress and piggy_bank (defense in depth)
DROP TRIGGER IF EXISTS guard_game_progress_client_updates_trg ON public.game_progress;
CREATE TRIGGER guard_game_progress_client_updates_trg
BEFORE UPDATE ON public.game_progress
FOR EACH ROW EXECUTE FUNCTION public.guard_game_progress_client_updates();

DROP TRIGGER IF EXISTS guard_piggy_bank_client_updates_trg ON public.piggy_bank
;
CREATE TRIGGER guard_piggy_bank_client_updates_trg
BEFORE UPDATE ON public.piggy_bank
FOR EACH ROW EXECUTE FUNCTION public.guard_piggy_bank_client_updates();

-- 2) Restrict product_orders SELECT policies to authenticated role only
DROP POLICY IF EXISTS "Users can view their own orders" ON public.product_orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON public.product_orders;
DROP POLICY IF EXISTS "Admins can update all orders" ON public.product_orders;

CREATE POLICY "Users can view their own orders"
ON public.product_orders
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all orders"
ON public.product_orders
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all orders"
ON public.product_orders
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- 3) Storage RLS policies for the private 'proyectosfcg' bucket: owners only
DROP POLICY IF EXISTS "proyectosfcg owners can read" ON storage.objects;
DROP POLICY IF EXISTS "proyectosfcg owners can insert" ON storage.objects;
DROP POLICY IF EXISTS "proyectosfcg owners can update" ON storage.objects;
DROP POLICY IF EXISTS "proyectosfcg owners can delete" ON storage.objects;

CREATE POLICY "proyectosfcg owners can read"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'proyectosfcg' AND owner = auth.uid());

CREATE POLICY "proyectosfcg owners can insert"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'proyectosfcg' AND owner = auth.uid());

CREATE POLICY "proyectosfcg owners can update"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'proyectosfcg' AND owner = auth.uid())
WITH CHECK (bucket_id = 'proyectosfcg' AND owner = auth.uid());

CREATE POLICY "proyectosfcg owners can delete"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'proyectosfcg' AND owner = auth.uid());
