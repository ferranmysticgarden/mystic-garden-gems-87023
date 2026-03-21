import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Admin role check
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { action, payload } = await req.json();

    switch (action) {
      // ── Update game progress (gems, lives, level, powerups) ──
      case "update_progress": {
        const { userId, field, value } = payload;
        const allowed = ["gems", "lives", "current_level", "hammer_count", "undo_count", "shuffle_count", "no_ads_until", "unlimited_lives_until"];
        if (!allowed.includes(field)) {
          return new Response(JSON.stringify({ error: `Field '${field}' not allowed` }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await supabase
          .from("game_progress")
          .update({ [field]: value })
          .eq("user_id", userId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Set user role ──
      case "set_role": {
        const { userId, role } = payload;
        if (!["admin", "moderator", "user"].includes(role)) {
          return new Response(JSON.stringify({ error: "Invalid role" }),
            { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        // Upsert: delete existing then insert
        await supabase.from("user_roles").delete().eq("user_id", userId);
        if (role !== "user") {
          const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Delete user (ban) ──
      case "delete_user": {
        const { userId } = payload;
        // Delete from auth (cascades to profiles, game_progress, etc.)
        const { error } = await supabase.auth.admin.deleteUser(userId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Delete a purchase ──
      case "delete_purchase": {
        const { purchaseId } = payload;
        const { error } = await supabase.from("user_purchases").delete().eq("id", purchaseId);
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      // ── Get full user detail ──
      case "get_user_detail": {
        const { userId } = payload;
        const [profileRes, progressRes, purchasesRes, rolesRes] = await Promise.all([
          supabase.from("profiles").select("*").eq("id", userId).single(),
          supabase.from("game_progress").select("*").eq("user_id", userId).single(),
          supabase.from("user_purchases").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
          supabase.from("user_roles").select("*").eq("user_id", userId),
        ]);
        return new Response(JSON.stringify({
          profile: profileRes.data,
          progress: progressRes.data,
          purchases: purchasesRes.data,
          roles: rolesRes.data,
        }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    console.error("Admin action error:", error);
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
