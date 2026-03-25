import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify the user's JWT
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Server-side admin role check
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body for data type
    const { dataType } = await req.json();

    let data = null;

    switch (dataType) {
      case "profiles":
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        data = profiles;
        break;

      case "purchases":
        const { data: purchases } = await supabase
          .from("user_purchases")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(100);
        data = purchases;
        break;

      case "progress":
        const { data: progress } = await supabase
          .from("game_progress")
          .select("*")
          .order("updated_at", { ascending: false })
          .limit(100);
        data = progress;
        break;

      case "achievements":
        const { data: achievements } = await supabase
          .from("achievements")
          .select("*")
          .order("unlocked_at", { ascending: false })
          .limit(100);
        data = achievements;
        break;

      case "stats":
        const { count: totalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const { count: totalPurchases } = await supabase
          .from("user_purchases")
          .select("*", { count: "exact", head: true });

        const { data: avgProgress } = await supabase
          .from("game_progress")
          .select("current_level, gems");

        const avgLevel = avgProgress?.length 
          ? avgProgress.reduce((sum, p) => sum + p.current_level, 0) / avgProgress.length 
          : 0;

        const totalGems = avgProgress?.reduce((sum, p) => sum + p.gems, 0) || 0;

        data = { totalUsers, totalPurchases, avgLevel: avgLevel.toFixed(1), totalGems };
        break;

      case "guest_stats": {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString();
        // Funnel uses "today since midnight UTC" so it resets daily
        const funnelStart = todayStart;

        // Guest sessions
        const { count: todayGuests } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "guest_session")
          .gte("created_at", todayStart);

        const { count: weekGuests } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "guest_session")
          .gte("created_at", weekStart);

        const { count: totalGuests } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "guest_session");

        // Unique devices
        const { data: todayDevices } = await supabase
          .from("app_events")
          .select("device_id")
          .eq("event_name", "guest_session")
          .gte("created_at", todayStart);

        const { data: weekDevices } = await supabase
          .from("app_events")
          .select("device_id")
          .eq("event_name", "guest_session")
          .gte("created_at", weekStart);

        const { data: allDevices } = await supabase
          .from("app_events")
          .select("device_id")
          .eq("event_name", "guest_session");

        const uniqueToday = new Set(todayDevices?.map(d => d.device_id)).size;
        const uniqueWeek = new Set(weekDevices?.map(d => d.device_id)).size;
        const uniqueTotal = new Set(allDevices?.map(d => d.device_id)).size;

        // === FUNNEL METRICS (last 24h) ===
        const { data: last24hDevices } = await supabase
          .from("app_events")
          .select("device_id")
          .eq("event_name", "guest_session")
          .gte("created_at", last24h);
        const uniqueLast24h = new Set(last24hDevices?.map(d => d.device_id)).size;

        const { count: sessions24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "guest_session")
          .gte("created_at", last24h);

        const { count: purchaseAttempts24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_attempt")
          .gte("created_at", last24h);

        const { count: purchaseCancelled24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_cancelled")
          .gte("created_at", last24h);

        const { count: offersShown24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "offer_shown")
          .gte("created_at", last24h);

        const { count: noLivesModal24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "no_lives_modal_shown")
          .gte("created_at", last24h);

        const { count: billingErrors24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "billing_error")
          .gte("created_at", last24h);

        const { count: purchaseSuccess24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_success")
          .gte("created_at", last24h);

        data = {
          todaySessions: todayGuests || 0,
          weekSessions: weekGuests || 0,
          totalSessions: totalGuests || 0,
          uniqueToday,
          uniqueWeek,
          uniqueTotal,
          // Funnel 24h
          uniqueLast24h,
          sessions24h: sessions24h || 0,
          purchaseAttempts24h: purchaseAttempts24h || 0,
          purchaseCancelled24h: purchaseCancelled24h || 0,
          offersShown24h: offersShown24h || 0,
          noLivesModal24h: noLivesModal24h || 0,
          billingErrors24h: billingErrors24h || 0,
          purchaseSuccess24h: purchaseSuccess24h || 0,
        };
        break;
      }

      default:
        return new Response(
          JSON.stringify({ error: "Invalid data type" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }

    return new Response(
      JSON.stringify({ data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Admin data error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
