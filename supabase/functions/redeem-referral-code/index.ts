import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REFERRED_REWARD_GEMS = 50;      // amigo invitado, al canjear
const REFERRER_REWARD_GEMS = 150;     // invitador, cuando el amigo llega a nivel 5
const QUALIFICATION_LEVEL = 5;

type Action = "redeem" | "check_qualification";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const userResp = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!userResp.ok) throw new Error("Unauthorized");
    const { id: userId } = await userResp.json();
    if (!userId) throw new Error("Unauthorized");

    const body = await req.json().catch(() => ({}));
    const action: Action = body.action || "redeem";
    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // ============================================================
    // Action: REDEEM — friend enters inviter's code
    // ============================================================
    if (action === "redeem") {
      const rawCode = String(body.code || "").trim().toUpperCase();
      if (!rawCode) throw new Error("missing_code");

      // Already referred?
      const { data: existingRef } = await admin
        .from("referrals")
        .select("id")
        .eq("referred_user_id", userId)
        .maybeSingle();
      if (existingRef) {
        return new Response(JSON.stringify({ success: false, error: "already_redeemed" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Lookup referrer
      const { data: codeRow } = await admin
        .from("referral_codes")
        .select("user_id, code")
        .eq("code", rawCode)
        .maybeSingle();
      if (!codeRow) {
        return new Response(JSON.stringify({ success: false, error: "invalid_code" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (codeRow.user_id === userId) {
        return new Response(JSON.stringify({ success: false, error: "self_referral" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Grant referred gems immediately
      const { data: prog } = await admin
        .from("game_progress")
        .select("gems")
        .eq("user_id", userId)
        .maybeSingle();
      const newGems = ((prog?.gems as number | null) ?? 0) + REFERRED_REWARD_GEMS;
      const { error: upErr } = await admin
        .from("game_progress")
        .update({ gems: newGems, updated_at: new Date().toISOString() })
        .eq("user_id", userId);
      if (upErr) throw upErr;

      const { error: insErr } = await admin.from("referrals").insert({
        referrer_user_id: codeRow.user_id,
        referred_user_id: userId,
        code: rawCode,
        status: "redeemed",
        referred_gems_granted: REFERRED_REWARD_GEMS,
        referred_rewarded_at: new Date().toISOString(),
      });
      if (insErr) throw insErr;

      return new Response(
        JSON.stringify({ success: true, gems_granted: REFERRED_REWARD_GEMS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ============================================================
    // Action: CHECK_QUALIFICATION — friend reached QUALIFICATION_LEVEL
    // ============================================================
    if (action === "check_qualification") {
      // Look up my referral row (if I was invited)
      const { data: ref } = await admin
        .from("referrals")
        .select("id, referrer_user_id, status")
        .eq("referred_user_id", userId)
        .maybeSingle();
      if (!ref || ref.status === "rewarded") {
        return new Response(JSON.stringify({ success: true, granted: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check my current level progress
      const { data: myProg } = await admin
        .from("game_progress")
        .select("current_level, completed_levels")
        .eq("user_id", userId)
        .maybeSingle();

      const completed: number[] = Array.isArray(myProg?.completed_levels)
        ? (myProg?.completed_levels as number[])
        : [];
      const maxCompleted = completed.length ? Math.max(...completed) : 0;
      const currentLvl = (myProg?.current_level as number | null) ?? 0;
      const reached = Math.max(maxCompleted, currentLvl);
      if (reached < QUALIFICATION_LEVEL) {
        return new Response(JSON.stringify({ success: true, granted: false }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Grant referrer gems
      const { data: refProg } = await admin
        .from("game_progress")
        .select("gems")
        .eq("user_id", ref.referrer_user_id)
        .maybeSingle();
      const newRefGems = ((refProg?.gems as number | null) ?? 0) + REFERRER_REWARD_GEMS;
      const { error: refUpErr } = await admin
        .from("game_progress")
        .update({ gems: newRefGems, updated_at: new Date().toISOString() })
        .eq("user_id", ref.referrer_user_id);
      if (refUpErr) throw refUpErr;

      const nowIso = new Date().toISOString();
      const { error: rUpdErr } = await admin
        .from("referrals")
        .update({
          status: "rewarded",
          qualified_at: nowIso,
          referrer_rewarded_at: nowIso,
          referrer_gems_granted: REFERRER_REWARD_GEMS,
        })
        .eq("id", ref.id);
      if (rUpdErr) throw rUpdErr;

      return new Response(
        JSON.stringify({ success: true, granted: true, gems_to_referrer: REFERRER_REWARD_GEMS }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    throw new Error("invalid_action");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[redeem-referral-code] ERROR", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
