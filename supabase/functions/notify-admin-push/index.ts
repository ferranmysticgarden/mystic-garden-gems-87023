import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Topic único para tu canal de notificaciones - NO compartir
const NTFY_TOPIC = "mystic-garden-admin-7225";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { title, message, priority, tags } = await req.json();

    const safeTitle = (title || "Mystic Garden").replace(/[^\x20-\x7E]/g, '');
    const safeTags = (tags || "video_game").replace(/[^\x20-\x7E,]/g, '');

    const res = await fetch(`https://ntfy.sh/${NTFY_TOPIC}`, {
      method: "POST",
      headers: {
        "Title": safeTitle,
        "Priority": priority || "default",
        "Tags": safeTags,
      },
      body: message || "Nuevo evento",
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("[PUSH] ntfy error:", errText);
      throw new Error(`ntfy failed: ${res.status}`);
    }

    console.log("[PUSH] ✅ Notification sent:", title);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[PUSH] ❌", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
