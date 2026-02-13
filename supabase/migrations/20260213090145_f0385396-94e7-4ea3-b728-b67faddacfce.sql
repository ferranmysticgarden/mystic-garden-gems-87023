-- Prevent profile deletion (no user should delete their own profile)
CREATE POLICY "Prevent profile deletion"
ON public.profiles
FOR DELETE
USING (false);