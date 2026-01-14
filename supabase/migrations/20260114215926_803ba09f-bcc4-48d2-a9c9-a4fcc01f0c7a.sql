-- Drop existing restrictive policies and recreate as permissive with proper auth checks
-- This ensures anonymous users cannot access any data

-- Profiles table policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

-- User purchases table policies
DROP POLICY IF EXISTS "Users can view their own purchases" ON public.user_purchases;
DROP POLICY IF EXISTS "Users can insert their own purchases" ON public.user_purchases;

CREATE POLICY "Users can view their own purchases" 
ON public.user_purchases 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own purchases" 
ON public.user_purchases 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);