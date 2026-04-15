import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Returns the current app version configuration.
 * The app calls this on startup to decide if it needs a native update.
 *
 * - minNativeVersionCode: The minimum native build code required.
 *   If the user's app has a lower versionCode, they MUST update from Google Play.
 *
 * - latestWebVersion: Informational only (web loads from published URL via OTA).
 *
 * To force a native update, bump minNativeVersionCode here and redeploy.
 */
serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const versionConfig = {
      // ── Native version control ──
      // Bump this when a new AAB with native changes is required.
      // Users with versionCode < this will see a "force update" modal.
      minNativeVersionCode: 2063,

      // ── Informational ──
      latestWebVersion: "2.0.6.3",
      latestNativeVersionCode: 2063,
      latestNativeVersionName: "2.0.6.3",

      // ── Play Store URL ──
      playStoreUrl: "https://play.google.com/store/apps/details?id=com.mysticgarden.game",

      // ── Optional message ──
      updateMessage: null as string | null,
    };

    return new Response(JSON.stringify(versionConfig), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
