import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeo de productos del juego a precios de Stripe (Cuenta: acct_1SqILHPxvUpv2yak)
const PRODUCT_PRICES: Record<string, string> = {
  // Gemas
  "gems_100": "price_1SwC1uPxvUpv2yaknEvmYMKo",
  "gems_300": "price_1SwC27PxvUpv2yaknxghKfhG",
  "gems_1200": "price_1SwC2KPxvUpv2yak5Cf5hvjE",
  // Sin anuncios
  "no_ads_month": "price_1SwC2XPxvUpv2yakzLULeJPP",
  "no_ads_forever": "price_1SwC2pPxvUpv2yakPTbVH6W0",
  // Suscripción
  "garden_pass": "price_1SwC3KPxvUpv2yakxDYVKdsx",
  // Packs principales
  "quick_pack": "price_1SwC3ePxvUpv2yakitUEtrbt",
  "mega_pack_inicial": "price_1SwC3sPxvUpv2yakpk9AvEr2",
  "pack_revancha": "price_1SwC48PxvUpv2yak43bIy9ED",
  // Ofertas de nivel
  "victory_multiplier": "price_1SwC4UPxvUpv2yakS90wIhNe",
  "finish_level": "price_1SwC55PxvUpv2yakaAMufOsE",
  "starter_pack": "price_1SwC5TPxvUpv2yakU9MsfDZS",
  "continue_game": "price_1SwC5mPxvUpv2yaks3JEMRJn",
  "flash_offer": "price_1SwC4UPxvUpv2yakS90wIhNe",
  // Micro-transacciones €0.50 (mínimo Stripe)
  "buy_moves": "price_1Sx2ffPxvUpv2yakLqNF0Mlg",
  "welcome_pack": "price_1Sx2g2PxvUpv2yakNxaBeR3a",
  "extra_spin": "price_1Sx2gcPxvUpv2yakAQHL5UKW",
  "streak_protection": "price_1Sx2gxPxvUpv2yak7WnJE3Eo",
  "lifesaver_pack": "price_1Sx2hKPxvUpv2yakkBJPimfq",
  "reward_doubler": "price_1Sx2hYPxvUpv2yaknaIPYKzW",
  // Experience Packs
  "pack_victoria_segura": "price_1SwC7xPxvUpv2yakQ0CmX5uN",
  "pack_racha_infinita": "price_1SwC8APxvUpv2yakGXumP9b1",
  // Multi-tier packs
  "pack_impulso": "price_1SwC8OPxvUpv2yakqAuraXxH",
  "pack_experiencia": "price_1SwC8gPxvUpv2yakRe3NKrI2",
  "pack_victoria_segura_pro": "price_1SwC99PxvUpv2yakvtPl1F0r",
  // First day offer
  "first_day_offer": "price_1SwC9OPxvUpv2yakOtw7E4ue",
  // Cofres (web)
  "chest_silver": "price_1T1Q8KPxvUpv2yakThqAtlyy",
  "chest_gold": "price_1T1Q8ZPxvUpv2yak0AU20DiC",
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