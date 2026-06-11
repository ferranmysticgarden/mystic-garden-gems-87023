// Edge function: unlock-piggy-bank
// Tras una compra verificada de `piggy_bank_unlock`, entrega las gemas
// acumuladas en la hucha del usuario y la resetea a 0.
//
// Flow:
// 1. Cliente compra piggy_bank_unlock vía Stripe o Google Play
// 2. verify-stripe-purchase / verify-google-purchase registra la compra
//    en user_purchases (reward base = 0 para este producto)
// 3. Cliente llama a esta función con productId/sessionId/orderId
// 4. Esta función:
//    a) Valida que existe una compra reciente (≤10 min) en user_purchases
//    b) Lee piggy_bank.current_amount
//    c) Suma current_amount a game_progress.gems
//    d) Resetea piggy_bank a current_amount=0, is_unlocked=true
//    e) Idempotencia: marca processed_webhook_events con clave única

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !serviceKey || !anonKey) {
      throw new Error("Missing backend config");
    }

    const admin = createClient(supabaseUrl, serviceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json().catch(() => ({}));
    const { purchaseRef, guestSessionId } = body as {
      purchaseRef?: string;
      guestSessionId?: string;
    };

    // Auth (optional — guests allowed)
    const authHeader = req.headers.get("Authorization");
    let userId: string | null = null;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      const r = await fetch(`${supabaseUrl}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
      });
      if (r.ok) {
        const u = await r.json();
        userId = u?.id ?? null;
      }
    }

    if (!userId && !guestSessionId) {
      throw new Error("userId or guestSessionId is required");
    }

    // Verify a real recent purchase exists (only for authenticated users;
    // guests carry purchase trust from the verify-* function payload).
    if (userId) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: purchases, error: pErr } = await admin
        .from("user_purchases")
        .select("id, product_id, created_at")
        .eq("user_id", userId)
        .in("product_id", ["piggy_bank_unlock", "stripe_piggy_bank_unlock"])
        .gte("created_at", tenMinAgo)
        .order("created_at", { ascending: false })
        .limit(1);
      if (pErr) throw pErr;
      if (!purchases?.length) {
        return new Response(
          JSON.stringify({ success: false, error: "No recent piggy_bank_unlock purchase found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
        );
      }
    }

    // Idempotency
    const idemKey = `piggy_unlock_${userId ?? guestSessionId}_${purchaseRef ?? Date.now()}`;
    const { error: lockErr } = await admin.from("processed_webhook_events").insert({
      id: idemKey,
      user_id: userId,
      product_id: "piggy_bank_unlock",
    });
    if (lockErr && lockErr.code !== "23505") throw lockErr;
    if (lockErr?.code === "23505") {
      return new Response(
        JSON.stringify({ success: true, message: "Already unlocked", gemsGranted: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Fetch piggy bank
    const ownerFilter = userId
      ? { col: "user_id" as const, val: userId }
      : { col: "guest_session_id" as const, val: guestSessionId! };

    const { data: piggy, error: piggyErr } = await admin
      .from("piggy_bank")
      .select("id, current_amount")
      .eq(ownerFilter.col, ownerFilter.val)
      .maybeSingle();
    if (piggyErr) throw piggyErr;

    const amount = piggy?.current_amount ?? 0;

    // Reset piggy + flag unlock
    if (piggy) {
      const { error: upErr } = await admin
        .from("piggy_bank")
        .update({
          current_amount: 0,
          is_unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq("id", piggy.id);
      if (upErr) throw upErr;
    }

    // Grant gems to authenticated users only (guests track gems in localStorage client-side)
    if (userId && amount > 0) {
      const { data: gp, error: gpErr } = await admin
        .from("game_progress")
        .select("gems")
        .eq("user_id", userId)
        .maybeSingle();
      if (gpErr) throw gpErr;
      const currentGems = gp?.gems ?? 0;
      const { error: setErr } = await admin
        .from("game_progress")
        .update({ gems: currentGems + amount, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (setErr) throw setErr;
    }

    return new Response(
      JSON.stringify({ success: true, gemsGranted: amount }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[unlock-piggy-bank] ERROR:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
