import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Pricing tiers matching the frontend
const PRICING_TIERS = [
  { minLevel: 20, price: 29.00 },
  { minLevel: 15, price: 30.49 },
  { minLevel: 10, price: 31.49 },
  { minLevel: 5, price: 32.99 },
  { minLevel: 0, price: 34.99 },
];

function getPriceForLevel(level: number): number {
  for (const tier of PRICING_TIERS) {
    if (level >= tier.minLevel) return tier.price;
  }
  return 34.99;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
      throw new Error("Missing Supabase config");
    }

    // Auth (optional - guest checkout allowed)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    let userEmail: string | null = null;

    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data } = await supabaseClient.auth.getUser(token);
      userId = data.user?.id || null;
      userEmail = data.user?.email || null;
    }

    // Parse order data
    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      playerLevel,
      productName,
    } = await req.json();

    // Validate required fields
    if (!customerName || !customerEmail || !shippingAddress || !shippingCity || !shippingPostalCode) {
      throw new Error("Missing required fields");
    }

    const level = parseInt(playerLevel || '0', 10);
    const price = getPriceForLevel(level);
    const priceInCents = Math.round(price * 100);

    console.log(`[INFO] Product order: ${productName}, level: ${level}, price: €${price}`);

    // Create Stripe checkout session with dynamic pricing
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });

    const customers = await stripe.customers.list({ email: customerEmail, limit: 1 });
    let customerId: string | undefined;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    }

    const origin = req.headers.get("origin") || "https://mystic-garden-gems-87023.lovable.app";

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      line_items: [{
        price_data: {
          currency: 'eur',
          product_data: {
            name: productName || '3D Hologram Fan',
            description: `Precio exclusivo Nivel ${level} - Envío incluido`,
          },
          unit_amount: priceInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: `${origin}/product?payment=success&level=${level}`,
      cancel_url: `${origin}/product?payment=cancel&level=${level}`,
      metadata: {
        user_id: userId || 'guest',
        product_name: productName || '3D Hologram Fan',
        player_level: String(level),
        customer_name: customerName,
        customer_phone: customerPhone || '',
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode,
        shipping_country: shippingCountry || 'España',
      },
    });

    // Save order to database
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: insertError } = await supabaseAdmin
      .from('product_orders')
      .insert({
        user_id: userId,
        product_name: productName || '3D Hologram Fan',
        price_paid: price,
        currency: 'EUR',
        player_level: level,
        customer_name: customerName,
        customer_email: customerEmail,
        customer_phone: customerPhone || null,
        shipping_address: shippingAddress,
        shipping_city: shippingCity,
        shipping_postal_code: shippingPostalCode,
        shipping_country: shippingCountry || 'España',
        status: 'pending_payment',
        stripe_session_id: session.id,
      });

    if (insertError) {
      console.error("[WARN] Failed to save order:", insertError.message);
    }

    // Send notification email to admin
    try {
      await fetch(`${supabaseUrl}/functions/v1/notify-product-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`,
        },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress,
          shippingCity,
          shippingPostalCode,
          shippingCountry: shippingCountry || 'España',
          price,
          playerLevel: level,
          productName: productName || '3D Hologram Fan',
          stripeSessionId: session.id,
        }),
      });
    } catch (emailErr) {
      console.error("[WARN] Email notification failed:", emailErr);
    }

    console.log("[INFO] ✅ Product checkout session created:", session.id);

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[ERROR] ❌ create-product-payment:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
