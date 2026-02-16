import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapeo de productos del juego a precios de Stripe (Cuenta: acct_1SqILHPxvUpv2yak)
// IMPORTANTE: Stripe requiere mínimo €0.50 para checkout sessions
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
  "buy_moves": "price_1Sx2ffPxvUpv2yakLqNF0Mlg",           // €0.50 - Continuar Nivel
  "welcome_pack": "price_1Sx2g2PxvUpv2yakNxaBeR3a",        // €0.50 - Pack Bienvenida
  "extra_spin": "price_1Sx2gcPxvUpv2yakAQHL5UKW",          // €0.50 - Giro Extra
  "streak_protection": "price_1Sx2gxPxvUpv2yak7WnJE3Eo",   // €0.50 - Protección Racha
  "lifesaver_pack": "price_1Sx2hKPxvUpv2yakkBJPimfq",      // €0.50 - Pack Salvavidas
  "reward_doubler": "price_1Sx2hYPxvUpv2yaknaIPYKzW",      // €0.50 - Duplicador
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
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating payment:", errorMessage);
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});