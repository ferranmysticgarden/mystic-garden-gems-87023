
-- 1) product_orders: tighten INSERT policy to authenticated users only
DROP POLICY IF EXISTS "Users can insert their own orders" ON public.product_orders;

CREATE POLICY "Authenticated users can insert their own orders"
ON public.product_orders
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

-- 2) Revoke EXECUTE on trigger-only SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.initialize_game_progress() FROM PUBLIC, anon, authenticated;

COMMENT ON FUNCTION public.handle_new_user() IS 'Trigger-only function. Do NOT call from client. Runs as SECURITY DEFINER on auth.users INSERT.';
COMMENT ON FUNCTION public.initialize_game_progress() IS 'Trigger-only function. Do NOT call from client. Runs as SECURITY DEFINER on profiles INSERT.';

-- 3) Explicit deny policies for proyectosfcg storage bucket (server-side only access)
DROP POLICY IF EXISTS "Deny client access to proyectosfcg select" ON storage.objects;
DROP POLICY IF EXISTS "Deny client access to proyectosfcg insert" ON storage.objects;
DROP POLICY IF EXISTS "Deny client access to proyectosfcg update" ON storage.objects;
DROP POLICY IF EXISTS "Deny client access to proyectosfcg delete" ON storage.objects;

CREATE POLICY "Deny client access to proyectosfcg select"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id <> 'proyectosfcg');

CREATE POLICY "Deny client access to proyectosfcg insert"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id <> 'proyectosfcg');

CREATE POLICY "Deny client access to proyectosfcg update"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id <> 'proyectosfcg')
WITH CHECK (bucket_id <> 'proyectosfcg');

CREATE POLICY "Deny client access to proyectosfcg delete"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id <> 'proyectosfcg');
