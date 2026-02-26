
-- Table for external product orders (hologram fan, etc.)
CREATE TABLE public.product_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  product_name TEXT NOT NULL,
  price_paid NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  player_level INTEGER NOT NULL DEFAULT 0,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  shipping_address TEXT NOT NULL,
  shipping_city TEXT NOT NULL,
  shipping_postal_code TEXT NOT NULL,
  shipping_country TEXT NOT NULL DEFAULT 'España',
  status TEXT NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.product_orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view their own orders"
  ON public.product_orders FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own orders
CREATE POLICY "Users can insert their own orders"
  ON public.product_orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "Admins can view all orders"
  ON public.product_orders FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can update orders (change status)
CREATE POLICY "Admins can update all orders"
  ON public.product_orders FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Service role can update orders (from edge functions)
CREATE POLICY "Service role can update orders"
  ON public.product_orders FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Trigger for updated_at
CREATE TRIGGER update_product_orders_updated_at
  BEFORE UPDATE ON public.product_orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
