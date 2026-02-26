
-- Remove overly permissive policy (edge functions use service_role which bypasses RLS)
DROP POLICY IF EXISTS "Service role can update orders" ON public.product_orders;
