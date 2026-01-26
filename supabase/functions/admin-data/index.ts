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
