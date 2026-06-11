// Edge function: claim-season-tier
// Reclama las recompensas de un tier del season pass.
// Valida server-side que:
//  - El usuario tiene progress_points >= tier.requiredPoints
//  - El tier_id NO está ya en claimed_tiers
//  - Si el tier es premium, el usuario tiene is_premium=true

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Canonical tier definitions (mirror of src/data/seasonPassTiers.ts).
// Server-side source of truth — never trust client values.
type TierReward = { gems?: number; lives?: number; powerups?: number };
type Tier = { id: number; requiredPoints: number; freeReward: TierReward; premiumReward: TierReward };

const TIERS: Tier[] = [
  { id: 1, requiredPoints: 100, freeReward: { gems: 20 }, premiumReward: { gems: 50, lives: 2 } },
  { id: 2, requiredPoints: 250, freeReward: { lives: 1 }, premiumReward: { gems: 100, powerups: 2 } },
  { id: 3, requiredPoints: 500, freeReward: { gems: 30 }, premiumReward: { gems: 150, lives: 3 } },
  { id: 4, requiredPoints: 800, freeReward: { powerups: 1 }, premiumReward: { gems: 200, lives: 5 } },
  { id: 5, requiredPoints: 1200, freeReward: { gems: 50 }, premiumReward: { gems: 300, lives: 5, powerups: 3 } },
  { id: 6, requiredPoints: 1700, freeReward: { lives: 2 }, premiumReward: { gems: 400, powerups: 5 } },
  { id: 7, requiredPoints: 2300, freeReward: { gems: 75 }, premiumReward: { gems: 500, lives: 10 } },
  { id: 8, requiredPoints: 3000, freeReward: { powerups: 2 }, premiumReward: { gems: 600, lives: 10, powerups: 5 } },
  { id: 9, requiredPoints: 4000, freeReward: { gems: 100 }, premiumReward: { gems: 800, lives: 15 } },
  { id: 10, requiredPoints: 5500, freeReward: { lives: 5 }, premiumReward: { gems: 1500, lives: 25, powerups: 10 } },
];

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
    const { seasonId, tierId, guestSessionId } = body as {
      seasonId: string;
      tierId: number;
      guestSessionId?: string;
    };

    if (!seasonId) throw new Error("seasonId is required");
    if (typeof tierId !== "number") throw new Error("tierId is required (number)");

    const tier = TIERS.find((t) => t.id === tierId);
    if (!tier) throw new Error(`Unknown tier ${tierId}`);

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

    const ownerFilter = userId
      ? { col: "user_id" as const, val: userId }
      : { col: "guest_session_id" as const, val: guestSessionId! };

    const { data: pass, error: passErr } = await admin
      .from("season_passes")
      .select("id, progress_points, is_premium, claimed_tiers")
      .eq(ownerFilter.col, ownerFilter.val)
      .eq("season_id", seasonId)
      .maybeSingle();
    if (passErr) throw passErr;
    if (!pass) {
      return new Response(JSON.stringify({ success: false, error: "Season pass not found" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 404,
      });
    }

    if (pass.progress_points < tier.requiredPoints) {
      return new Response(JSON.stringify({ success: false, error: "Insufficient progress" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 403,
      });
    }

    const claimed: number[] = Array.isArray(pass.claimed_tiers) ? pass.claimed_tiers : [];
    if (claimed.includes(tierId)) {
      return new Response(JSON.stringify({ success: false, error: "Tier already claimed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 409,
      });
    }

    // Choose reward (premium if pass.is_premium, else free)
    const reward: TierReward = pass.is_premium ? tier.premiumReward : tier.freeReward;

    // Apply reward to game_progress (auth users only).
    // Guest users get the reward returned in the response payload; client applies locally.
    if (userId) {
      const { data: gp, error: gpErr } = await admin
        .from("game_progress")
        .select("gems, lives, hammer_count, shuffle_count, undo_count")
        .eq("user_id", userId)
        .maybeSingle();
      if (gpErr) throw gpErr;

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (reward.gems) updates.gems = (gp?.gems ?? 0) + reward.gems;
      if (reward.lives) updates.lives = Math.min((gp?.lives ?? 5) + reward.lives, 99);
      if (reward.powerups) {
        const perType = Math.floor(reward.powerups / 3);
        const remainder = reward.powerups % 3;
        updates.hammer_count = (gp?.hammer_count ?? 0) + perType + (remainder >= 1 ? 1 : 0);
        updates.shuffle_count = (gp?.shuffle_count ?? 0) + perType + (remainder >= 2 ? 1 : 0);
        updates.undo_count = (gp?.undo_count ?? 0) + perType;
      }

      if (gp) {
        const { error: upErr } = await admin
          .from("game_progress")
          .update(updates)
          .eq("user_id", userId);
        if (upErr) throw upErr;
      }
    }

    // Mark tier claimed (server-side: bypasses guard trigger)
    const newClaimed = [...claimed, tierId];
    const { error: claimErr } = await admin
      .from("season_passes")
      .update({ claimed_tiers: newClaimed })
      .eq("id", pass.id);
    if (claimErr) throw claimErr;

    return new Response(
      JSON.stringify({ success: true, tierId, reward, premium: pass.is_premium }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[claim-season-tier] ERROR:", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
