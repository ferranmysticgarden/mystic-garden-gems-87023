import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "npm:stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * Verifies a Stripe checkout session was actually paid.
 * Called from the client after returning from Stripe with ?payment=success.
 * Returns: { verified: true, productId, rewards } or { verified: false }
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (!supabaseUrl || !supabaseAnonKey) throw new Error("Missing backend config");

    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !data.user) {
      throw new Error("User not authenticated");
    }
    const userId = data.user.id;

    const { productId, sessionId } = await req.json();
    if (!productId || typeof productId !== "string") {
      throw new Error("productId is required");
    }

    if (!sessionId || typeof sessionId !== "string") {
      throw new Error("sessionId is required");
    }

    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const verified =
      session.payment_status === "paid" &&
      session.status === "complete" &&
      session.metadata?.user_id === userId &&
      session.metadata?.product_id === productId;

    if (!verified) {
      console.log(`[verify-stripe] Verification failed for session=${sessionId}, user=${userId}, product=${productId}`);
      return new Response(JSON.stringify({ verified: false, error: "Payment not verified" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    console.log(`[verify-stripe] ✅ Verified paid session ${session.id} for product=${productId}`);

    return new Response(JSON.stringify({
      verified: true,
      productId,
      sessionId: session.id,
      amountPaid: (session.amount_total || 0) / 100,
      paymentIntent: typeof session.payment_intent === 'string' ? session.payment_intent : null,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[verify-stripe] ERROR:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
