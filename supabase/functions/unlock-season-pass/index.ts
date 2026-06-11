// Edge function: unlock-season-pass
// Tras una compra verificada de `season_pass_premium`, marca is_premium=true
// para el season pass activo del usuario / invitado.

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
    const { seasonId, guestSessionId, purchaseRef } = body as {
      seasonId: string;
      guestSessionId?: string;
      purchaseRef?: string;
    };

    if (!seasonId) throw new Error("seasonId is required");

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

    // Verify recent purchase (auth only)
    if (userId) {
      const tenMinAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
      const { data: purchases, error: pErr } = await admin
        .from("user_purchases")
        .select("id")
        .eq("user_id", userId)
        .in("product_id", ["season_pass_premium", "stripe_season_pass_premium"])
        .gte("created_at", tenMinAgo)
        .limit(1);
      if (pErr) throw pErr;
      if (!purchases?.length) {
        return new Response(
          JSON.stringify({ success: false, error: "No recent season_pass_premium purchase found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 403 },
        );
      }
    }

    // Upsert season pass with is_premium=true
    const ownerFilter = userId
      ? { col: "user_id" as const, val: userId }
      : { col: "guest_session_id" as const, val: guestSessionId! };

    const { data: existing, error: exErr } = await admin
      .from("season_passes")
      .select("id, is_premium")
      .eq(ownerFilter.col, ownerFilter.val)
      .eq("season_id", seasonId)
      .maybeSingle();
    if (exErr) throw exErr;

    if (existing) {
      if (!existing.is_premium) {
        const { error: upErr } = await admin
          .from("season_passes")
          .update({
            is_premium: true,
            premium_purchased_at: new Date().toISOString(),
          })
          .eq("id", existing.id);
        if (upErr) throw upErr;
      }
    } else {
      const insertRow: Record<string, unknown> = {
        season_id: seasonId,
        is_premium: true,
        premium_purchased_at: new Date().toISOString(),
        progress_points: 0,
        claimed_tiers: [],
      };
      if (userId) insertRow.user_id = userId;
      else insertRow.guest_session_id = guestSessionId;

      const { error: insErr } = await admin.from("season_passes").insert(insertRow);
      if (insErr) throw insErr;
    }

    return new Response(
      JSON.stringify({ success: true, seasonId, isPremium: true }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[unlock-season-pass] ERROR:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
