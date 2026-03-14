import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeo de productos del juego a precios de Stripe (Cuenta FCG: acct_1SA78ZB6GI8NmIPn)
const PRODUCT_PRICES: Record<string, string> = {
  // Gemas
  "gems_100": "price_1TAlY4B6GI8NmIPnoUXVXoXT",
  "gems_300": "price_1TAlYKB6GI8NmIPn44P94iZy",
  "gems_1200": "price_1TAlYcB6GI8NmIPnVbAqDYeT",
  // Sin anuncios
  "no_ads_month": "price_1TAlZ3B6GI8NmIPn73pIMGxB",
  "no_ads_forever": "price_1TAlauB6GI8NmIPnhpQqBDBn",
  // Suscripción
  "garden_pass": "price_1TAlb9B6GI8NmIPn6UpoKwr9",
  // Packs principales
  "quick_pack": "price_1TAlbTPxvUpv2yakoCn3W1A3",
  "mega_pack_inicial": "price_1TAlbwB6GI8NmIPn3KS5Apvs",
  "pack_revancha": "price_1TAlcGB6GI8NmIPn4IldsQYl",
  // Ofertas de nivel
  "victory_multiplier": "price_1TAlcdB6GI8NmIPnZQNbhxxP",
  "finish_level": "price_1TAlcsB6GI8NmIPn94CdWVvt",
  "starter_pack": "price_1TAldAB6GI8NmIPnh7Zs7bPA",
  "continue_game": "price_1TAldOB6GI8NmIPnVxkW6pMc",
  "flash_offer": "price_1TAlcdB6GI8NmIPnZQNbhxxP",
  // Micro-transacciones €0.50
  "buy_moves": "price_1TAldiPxvUpv2yakU2nyMNfQ",
  "welcome_pack": "price_1TAle6B6GI8NmIPn8ayVTngg",
  "extra_spin": "price_1TAleWB6GI8NmIPnMZOGo2N6",
  "streak_protection": "price_1TAleoB6GI8NmIPn2iCVKVc3",
  "lifesaver_pack": "price_1TAlfFB6GI8NmIPnKkd6j757",
  "reward_doubler": "price_1TAlfXB6GI8NmIPnOsSnbulR",
  // Extra products (aliases)
  "extra_moves": "price_1TAldiPxvUpv2yakU2nyMNfQ",
  "first_purchase": "price_1TAle6B6GI8NmIPn8ayVTngg",
  // Vidas infinitas 30min (web)
  "unlimited_lives_30min": "price_1TAlfrB6GI8NmIPnuJjK1pUf",
  // Experience Packs
  "pack_victoria_segura": "price_1TAlg9B6GI8NmIPnbk8EpVYi",
  "pack_racha_infinita": "price_1TAlgXB6GI8NmIPnfNVMkqqO",
  // Multi-tier packs
  "pack_impulso": "price_1TAlguB6GI8NmIPnNXBvRUc1",
  "pack_experiencia": "price_1TAlhDB6GI8NmIPnhPHrcV57",
  "pack_victoria_segura_pro": "price_1TAlhWB6GI8NmIPnLXe9hVWu",
  // First day offer
  "first_day_offer": "price_1TAlhsPxvUpv2yakN9juOabs",
  // Cofres (web)
  "chest_silver": "price_1TAlimPxvUpv2yakhdlWFBHf",
  "chest_gold": "price_1TAlj7B6GI8NmIPnletS1ST2",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1. Validate env vars
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    
    console.log("[DEBUG] SUPABASE_URL present:", !!supabaseUrl, "length:", supabaseUrl?.length);
    console.log("[DEBUG] SUPABASE_ANON_KEY present:", !!supabaseAnonKey);
    console.log("[DEBUG] STRIPE_SECRET_KEY present:", !!stripeKey, "prefix:", stripeKey?.substring(0, 7));

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(`Missing Supabase config: URL=${!!supabaseUrl}, KEY=${!!supabaseAnonKey}`);
    }
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // 2. Auth
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("User not authenticated or email not available");
    console.log("[INFO] User authenticated:", user.email);

    // 3. Product lookup
    const { productId } = await req.json();
    const priceId = PRODUCT_PRICES[productId];
    if (!priceId) throw new Error(`Product ${productId} not found`);
    console.log("[INFO] Creating payment for product:", productId, "price:", priceId);

    // 4. Create Stripe session
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    console.log("[INFO] Customer lookup done, existing:", !!customerId);

    const origin = req.headers.get("origin") || "https://mystic-garden-gems-87023.lovable.app";
    
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${origin}/?payment=success`,
      cancel_url: `${origin}/?payment=cancel`,
      metadata: {
        user_id: user.id,
        product_id: productId,
      },
    });

    console.log("[INFO] ✅ Payment session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ERROR] ❌ create-payment failed:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});