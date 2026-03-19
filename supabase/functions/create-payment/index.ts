import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@14.21.0";
import { createClient } from "npm:@supabase/supabase-js@2.76.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Mapeo de productos del juego a precios de Stripe (Cuenta FCG: acct_1SA78ZB6GI8NmIPn)
const PRODUCT_PRICES: Record<string, string> = {
  // Gemas
  gems_100: "price_1TAmg2B6GI8NmIPniADboyZd",
  gems_300: "price_1TAolMB6GI8NmIPny1IrmuBB",
  gems_1200: "price_1TApZjB6GI8NmIPnKines1LB",
  // Sin anuncios
  no_ads_month: "price_1TAmhnB6GI8NmIPnuKlcpjCa",
  no_ads_forever: "price_1TAmiAB6GI8NmIPn8WG1DdLD",
  // Garden Pass
  garden_pass: "price_1TAmikB6GI8NmIPnulGhUk2B",
  // Packs principales
  quick_pack: "price_1TAmltB6GI8NmIPn51rEsiE2",
  mega_pack_inicial: "price_1TAmmIB6GI8NmIPnveD4dD2N",
  pack_revancha: "price_1TAmmaB6GI8NmIPnQLZWWdtt",
  // Ofertas de nivel
  victory_multiplier: "price_1TAmmsB6GI8NmIPnATdkUxno",
  finish_level: "price_1TAmnAB6GI8NmIPngsgoL9pf",
  starter_pack: "price_1TAmnRB6GI8NmIPnQemntW8N",
  continue_game: "price_1TAmnjB6GI8NmIPnEZouUfqq",
  flash_offer: "price_1TAmmsB6GI8NmIPnATdkUxno",
  // Micro-transacciones €0.50
  buy_moves: "price_1TAolzB6GI8NmIPn3ayBTFXP",
  welcome_pack: "price_1TAmowB6GI8NmIPnYWc5k1NH",
  extra_spin: "price_1TAmpDB6GI8NmIPnpIoVj1KV",
  streak_protection: "price_1TAleoB6GI8NmIPn2iCVKVc3",
  lifesaver_pack: "price_1TAlfFB6GI8NmIPnKkd6j757",
  reward_doubler: "price_1TAlfXB6GI8NmIPnOsSnbulR",
  // Extra products (aliases)
  extra_moves: "price_1TAolzB6GI8NmIPn3ayBTFXP",
  first_purchase: "price_1TAmowB6GI8NmIPnYWc5k1NH",
  // Vidas infinitas 30min (web)
  unlimited_lives_30min: "price_1TAlfrB6GI8NmIPnuJjK1pUf",
  // Experience Packs
  pack_victoria_segura: "price_1TAlg9B6GI8NmIPnbk8EpVYi",
  pack_racha_infinita: "price_1TAlgXB6GI8NmIPnfNVMkqqO",
  // Multi-tier packs
  pack_impulso: "price_1TAlguB6GI8NmIPnNXBvRUc1",
  pack_experiencia: "price_1TAlhDB6GI8NmIPnhPHrcV57",
  pack_victoria_segura_pro: "price_1TAlhWB6GI8NmIPnLXe9hVWu",
  // First day offer
  first_day_offer: "price_1TAmpVB6GI8NmIPn7l00f2jG",
  // Cofres (web)
  chest_silver: "price_1TAmplB6GI8NmIPnlk5g494D",
  chest_gold: "price_1TAlj7B6GI8NmIPnletS1ST2",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error("Missing backend config");
    }
    if (!stripeKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data.user?.email) {
      throw new Error("User not authenticated or email not available");
    }
    const user = data.user;

    const { productId } = await req.json();
    if (!productId || typeof productId !== "string") {
      throw new Error("productId is required");
    }

    const priceId = PRODUCT_PRICES[productId];
    if (!priceId) {
      throw new Error(`Product ${productId} not found`);
    }

    const FALLBACK_PRICE_DATA: Record<string, { amount: number; name: string }> = {
      gems_100: { amount: 99, name: "100 Gems" },
      gems_300: { amount: 299, name: "300 Gems" },
      gems_1200: { amount: 999, name: "1200 Gems" },
      buy_moves: { amount: 50, name: "Buy Moves" },
      extra_moves: { amount: 50, name: "Extra Moves" },
      quick_pack: { amount: 99, name: "Quick Pack" },
      starter_pack: { amount: 99, name: "Starter Pack" },
      continue_game: { amount: 50, name: "Continue Game" },
      welcome_pack: { amount: 50, name: "Welcome Pack" },
      flash_offer: { amount: 50, name: "Flash Offer" },
      victory_multiplier: { amount: 50, name: "Victory Multiplier" },
      finish_level: { amount: 50, name: "Finish Level" },
      no_ads_month: { amount: 199, name: "No Ads Month" },
      no_ads_forever: { amount: 999, name: "No Ads Forever" },
      garden_pass: { amount: 999, name: "Garden Pass" },
      lifesaver_pack: { amount: 50, name: "Lifesaver Pack" },
      streak_protection: { amount: 50, name: "Streak Protection" },
      extra_spin: { amount: 50, name: "Extra Spin" },
      reward_doubler: { amount: 50, name: "Reward Doubler" },
      unlimited_lives_30min: { amount: 50, name: "Unlimited Lives 30min" },
      chest_silver: { amount: 199, name: "Chest Silver" },
      chest_gold: { amount: 399, name: "Chest Gold" },
      mega_pack_inicial: { amount: 299, name: "Mega Pack" },
      pack_revancha: { amount: 99, name: "Pack Revancha" },
      first_day_offer: { amount: 99, name: "First Day Offer" },
      pack_victoria_segura: { amount: 299, name: "Pack Victoria Segura" },
      pack_racha_infinita: { amount: 199, name: "Pack Racha Infinita" },
      pack_impulso: { amount: 199, name: "Pack Impulso" },
      pack_experiencia: { amount: 299, name: "Pack Experiencia" },
      pack_victoria_segura_pro: { amount: 399, name: "Pack Victoria Segura Pro" },
      first_purchase: { amount: 50, name: "First Purchase Pack" },
    };
    const fallback = FALLBACK_PRICE_DATA[productId];

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://mystic-garden-gems-87023.lovable.app";

    const createSession = async (lineItems: Stripe.Checkout.SessionCreateParams.LineItem[]) => {
      return stripe.checkout.sessions.create({
        customer: customerId,
        customer_email: customerId ? undefined : user.email,
        line_items: lineItems,
        mode: "payment",
        success_url: `${origin}/?payment=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/?payment=cancel`,
        metadata: {
          user_id: user.id,
          product_id: productId,
        },
      });
    };

    let session: Stripe.Checkout.Session;

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
