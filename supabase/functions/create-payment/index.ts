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
  "gems_100": "price_1TAmg2B6GI8NmIPniADboyZd",
  "gems_300": "price_1TAmgxPxvUpv2yakYJAjaVX6",
  "gems_1200": "price_1TAmhRPxvUpv2yakvEomJw5i",
  // Sin anuncios
  "no_ads_month": "price_1TAmhnB6GI8NmIPnuKlcpjCa",
  "no_ads_forever": "price_1TAmiAB6GI8NmIPn8WG1DdLD",
  // Garden Pass
  "garden_pass": "price_1TAmikB6GI8NmIPnulGhUk2B",
  // Packs principales
  "quick_pack": "price_1TAmltB6GI8NmIPn51rEsiE2",
  "mega_pack_inicial": "price_1TAmmIB6GI8NmIPnveD4dD2N",
  "pack_revancha": "price_1TAmmaB6GI8NmIPnQLZWWdtt",
  // Ofertas de nivel
  "victory_multiplier": "price_1TAmmsB6GI8NmIPnATdkUxno",
  "finish_level": "price_1TAmnAB6GI8NmIPngsgoL9pf",
  "starter_pack": "price_1TAmnRB6GI8NmIPnQemntW8N",
  "continue_game": "price_1TAmnjB6GI8NmIPnEZouUfqq",
  "flash_offer": "price_1TAmmsB6GI8NmIPnATdkUxno",
  // Micro-transacciones €0.50
  "buy_moves": "price_1TAmoUPxvUpv2yakjusoqZZb",
  "welcome_pack": "price_1TAmowB6GI8NmIPnYWc5k1NH",
  "extra_spin": "price_1TAmpDB6GI8NmIPnpIoVj1KV",
  "streak_protection": "price_1TAleoB6GI8NmIPn2iCVKVc3",
  "lifesaver_pack": "price_1TAlfFB6GI8NmIPnKkd6j757",
  "reward_doubler": "price_1TAlfXB6GI8NmIPnOsSnbulR",
  // Extra products (aliases)
  "extra_moves": "price_1TAmoUPxvUpv2yakjusoqZZb",
  "first_purchase": "price_1TAmowB6GI8NmIPnYWc5k1NH",
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
  "first_day_offer": "price_1TAmpVB6GI8NmIPn7l00f2jG",
  // Cofres (web)
  "chest_silver": "price_1TAmplB6GI8NmIPnlk5g494D",
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

    const FALLBACK_PRICE_DATA: Record<string, { amount: number; name: string }> = {
      gems_100: { amount: 99, name: "100 Gems" },
    };
    const fallback = FALLBACK_PRICE_DATA[productId];

    // 4. Create Stripe session
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const account = await stripe.accounts.retrieve();
    console.log("[INFO] Stripe account in use:", account.id, "livemode:", account.livemode);

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }
    console.log("[INFO] Customer lookup done, existing:", !!customerId);

    const origin = req.headers.get("origin") || "https://mystic-garden-gems-87023.lovable.app";

    const createSession = async (lineItems: any[]) => {
      return stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/?payment=success`,
        cancel_url: `${origin}/?payment=cancel`,
        metadata: {
          user_id: user.id,
          product_id: productId,
        },
      });
    };

    let session;
    try {
      session = await createSession([{ price: priceId, quantity: 1 }]);
    } catch (stripeError: unknown) {
      const stripeMessage = stripeError instanceof Error ? stripeError.message : String(stripeError);
      if (stripeMessage.includes("No such price") && fallback) {
        console.warn(`[WARN] Missing Stripe price ${priceId}. Using inline fallback for ${productId}.`);
        session = await createSession([
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: fallback.name,
                description: `Fallback checkout for ${productId}`,
              },
              unit_amount: fallback.amount,
            },
            quantity: 1,
          },
        ]);
      } else {
        throw stripeError;
      }
    }

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