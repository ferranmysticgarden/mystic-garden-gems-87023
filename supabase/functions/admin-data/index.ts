import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Dashboard reset point — large dashboard metrics count only data AFTER this timestamp.
// Falls back to a hardcoded default if no dynamic reset has been set.
const DEFAULT_DASHBOARD_EPOCH = "2026-03-26T13:20:00.000Z";

const getDashboardEpoch = async (supabase: any): Promise<string> => {
  const { data } = await supabase
    .from("app_events")
    .select("created_at")
    .eq("event_name", "dashboard_reset")
    .order("created_at", { ascending: false })
    .limit(1);
  if (data && data.length > 0) return data[0].created_at;
  return DEFAULT_DASHBOARD_EPOCH;
};

const PRODUCT_PRICES: Record<string, number> = {
  starter_gems: 0.5,
  quick_pack: 0.99,
  gems_100: 0.99,
  gems_300: 3.99,
  gems_1200: 9.99,
  no_ads_month: 4.99,
  no_ads_forever: 9.99,
  garden_pass: 9.99,
  flash_offer: 0.99,
  victory_multiplier: 0.99,
  finish_level: 0.99,
  extra_moves: 0.5,
  chest_silver: 0.99,
  chest_gold: 2.99,
  first_purchase: 0.99,
  starter_pack: 0.99,
  continue_game: 0.99,
  buy_moves: 0.49,
  welcome_pack: 0.5,
  reward_doubler: 0.5,
  pack_victoria_segura: 2.99,
  pack_racha_infinita: 1.99,
  pack_impulso: 0.99,
  pack_experiencia: 1.99,
  pack_victoria_segura_pro: 2.99,
  mega_pack_inicial: 0.99,
  pack_revancha: 0.99,
  lifesaver_pack: 0.5,
  streak_protection: 0.5,
  extra_spin: 0.5,
  unlimited_lives_30min: 0.99,
  first_day_offer: 0.99,
};

const normalizeProductId = (productId: string | null | undefined) => {
  if (!productId || productId.startsWith("gp_GPA")) return null;
  if (productId.startsWith("stripe_")) return productId.slice(7);
  if (productId.startsWith("gp_")) return productId.slice(3);
  return productId;
};

const getProductPrice = (productId: string | null | undefined) => {
  const normalized = normalizeProductId(productId);
  if (!normalized) return 0;
  return PRODUCT_PRICES[normalized] ?? 0;
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
          .gte("created_at", DASHBOARD_EPOCH)
          .order("created_at", { ascending: false })
          .limit(100);
        data = profiles;
        break;

      case "purchases":
        const { data: purchases } = await supabase
          .from("user_purchases")
          .select("*")
          .gte("created_at", DASHBOARD_EPOCH)
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
        const { count: usersSinceReset } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", DASHBOARD_EPOCH);

        const { count: historicalUsers } = await supabase
          .from("profiles")
          .select("*", { count: "exact", head: true });

        const { data: purchaseRowsSinceReset } = await supabase
          .from("user_purchases")
          .select("product_id, created_at")
          .gte("created_at", DASHBOARD_EPOCH);

        const { data: purchaseRowsHistorical } = await supabase
          .from("user_purchases")
          .select("product_id, created_at");

        const validPurchasesSinceReset = (purchaseRowsSinceReset || []).filter((purchase) => getProductPrice(purchase.product_id) > 0);
        const validPurchasesHistorical = (purchaseRowsHistorical || []).filter((purchase) => getProductPrice(purchase.product_id) > 0);

        const totalPurchases = validPurchasesSinceReset.length;
        const totalRevenue = validPurchasesSinceReset.reduce(
          (sum, purchase) => sum + getProductPrice(purchase.product_id),
          0,
        );

        const historicalPurchases = validPurchasesHistorical.length;
        const historicalRevenue = validPurchasesHistorical.reduce(
          (sum, purchase) => sum + getProductPrice(purchase.product_id),
          0,
        );

        const { data: avgProgress } = await supabase
          .from("game_progress")
          .select("current_level, gems");

        const avgLevel = avgProgress?.length 
          ? avgProgress.reduce((sum, p) => sum + p.current_level, 0) / avgProgress.length 
          : 0;

        const totalGems = avgProgress?.reduce((sum, p) => sum + p.gems, 0) || 0;

        data = {
          totalUsers: usersSinceReset || 0,
          historicalUsers: historicalUsers || 0,
          totalPurchases,
          historicalPurchases,
          totalRevenue,
          historicalRevenue,
          avgLevel: avgLevel.toFixed(1),
          totalGems,
          resetStartedAt: DASHBOARD_EPOCH,
        };
        break;

      case "guest_stats": {
        const now = new Date();
        const todayStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate(),
        )).toISOString();
        const weekStart = new Date(Date.UTC(
          now.getUTCFullYear(),
          now.getUTCMonth(),
          now.getUTCDate() - 7,
        )).toISOString();
        const resetStart = DASHBOARD_EPOCH;

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

        // === FUNNEL METRICS (since reset) ===
        const { data: funnelDevices } = await supabase
          .from("app_events")
          .select("device_id")
          .eq("event_name", "guest_session")
          .gte("created_at", resetStart);
        const uniqueLast24h = new Set(funnelDevices?.map(d => d.device_id)).size;

        const { count: sessions24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "guest_session")
          .gte("created_at", resetStart);

        const { count: purchaseAttempts24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_attempt")
          .gte("created_at", resetStart);

        const { count: purchaseCancelled24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_cancelled")
          .gte("created_at", resetStart);

        const { count: purchaseCancelledTotal } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_cancelled");

        const { count: offersShown24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "offer_shown")
          .gte("created_at", resetStart);

        const { count: offersShownTotal } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "offer_shown");

        const { count: noLivesModal24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "no_lives_modal_shown")
          .gte("created_at", resetStart);

        const { count: noLivesModalTotal } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "no_lives_modal_shown");

        const { count: billingErrors24h } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "billing_error")
          .gte("created_at", resetStart);

        const { count: billingErrorsTotal } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "billing_error");

        const { count: purchaseAttemptsTotal } = await supabase
          .from("app_events")
          .select("*", { count: "exact", head: true })
          .eq("event_name", "purchase_attempt");

        const { data: purchaseRows24h } = await supabase
          .from("user_purchases")
          .select("product_id")
          .gte("created_at", resetStart);

        const { data: purchaseRowsTotal } = await supabase
          .from("user_purchases")
          .select("product_id");

        const purchaseSuccess24h = (purchaseRows24h || []).filter((purchase) => getProductPrice(purchase.product_id) > 0).length;
        const purchaseSuccessTotal = (purchaseRowsTotal || []).filter((purchase) => getProductPrice(purchase.product_id) > 0).length;

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
          purchaseAttemptsTotal: purchaseAttemptsTotal || 0,
          purchaseCancelled24h: purchaseCancelled24h || 0,
          purchaseCancelledTotal: purchaseCancelledTotal || 0,
          offersShown24h: offersShown24h || 0,
          offersShownTotal: offersShownTotal || 0,
          noLivesModal24h: noLivesModal24h || 0,
          noLivesModalTotal: noLivesModalTotal || 0,
          billingErrors24h: billingErrors24h || 0,
          billingErrorsTotal: billingErrorsTotal || 0,
          purchaseSuccess24h,
          purchaseSuccessTotal,
          resetStartedAt: resetStart,
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
