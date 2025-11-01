import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeo de productos del juego a precios de Stripe
const PRODUCT_PRICES: Record<string, string> = {
  "gems_100": "price_1SOlx6FOm1x8pT7SJ8TaPGpp",
  "gems_300": "price_1SOlxOFOm1x8pT7SLLhpmfjo",
  "gems_1200": "price_1SOlxcFOm1x8pT7Su2qVAVIY",
  "no_ads_month": "price_1SOlxtFOm1x8pT7SqKoeeYTq",
  "no_ads_forever": "price_1SOly7FOm1x8pT7SypwYMFz9",
  "garden_pass": "price_1SOlyNFOm1x8pT7SzEKZMpYY",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");

    const { productId } = await req.json();
    const priceId = PRODUCT_PRICES[productId];
    
    if (!priceId) {
      throw new Error(`Product ${productId} not found`);
    }

    console.log("Creating payment for product:", productId, "price:", priceId);

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check if customer exists
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?payment=success`,
      cancel_url: `${req.headers.get("origin")}/?payment=cancel`,
      metadata: {
        user_id: user.id,
        product_id: productId,
      },
    });

    console.log("Payment session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});