import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      return new Response(JSON.stringify({ error: "Missing STRIPE_SECRET_KEY" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch("https://api.stripe.com/v1/webhook_endpoints?limit=5", {
      headers: {
        Authorization: `Bearer ${stripeKey}`,
      },
    });

    const data = await res.json();

    const normalized = Array.isArray(data?.data)
      ? data.data.map((e: Record<string, unknown>) => ({
          id: e.id,
          url: e.url,
          enabled_events: e.enabled_events,
          has_secret_field: Object.prototype.hasOwnProperty.call(e, "secret"),
          secret_value: e.secret ?? null,
        }))
      : [];

    return new Response(
      JSON.stringify({
        ok: res.ok,
        status: res.status,
        endpoints: normalized,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
