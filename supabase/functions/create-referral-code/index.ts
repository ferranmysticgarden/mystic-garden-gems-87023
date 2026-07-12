import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 8-char code, no ambiguous chars (0/O, 1/I/L)
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const genCode = (): string => {
  let s = "MG-";
  for (let i = 0; i < 6; i++) s += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return s;
};

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

    const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } });

    // Return existing code if any
    const { data: existing } = await admin
      .from("referral_codes")
      .select("code")
      .eq("user_id", userId)
      .maybeSingle();
    if (existing?.code) {
      return new Response(JSON.stringify({ success: true, code: existing.code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique
    for (let attempt = 0; attempt < 8; attempt++) {
      const code = genCode();
      const { error } = await admin
        .from("referral_codes")
        .insert({ user_id: userId, code });
      if (!error) {
        return new Response(JSON.stringify({ success: true, code }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      // 23505 = unique_violation, retry with new code
      if ((error as any).code !== "23505") throw error;
    }
    throw new Error("Could not generate unique code");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[create-referral-code] ERROR", msg);
    return new Response(JSON.stringify({ success: false, error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
