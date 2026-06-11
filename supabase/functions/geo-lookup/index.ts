/**
 * geo-lookup
 * ----------
 * Returns the ISO country code (e.g. "ES", "CO", "US") of the caller based on
 * their real IP address, NOT on their OS locale.
 *
 * Used by the client to enrich `app_events.event_data.country_ip` so campaign
 * decisions can be made on real geography instead of `Device.getLanguageTag()`.
 *
 * Defensive contract:
 *  - Always returns HTTP 200 with a JSON body `{ country: string | null }`.
 *  - Never throws to the caller.
 *  - If IP extraction or the GeoIP lookup fails for any reason, returns
 *    `{ country: null }` so the client can keep tracking without disruption.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const extractClientIp = (req: Request): string | null => {
  // Supabase Edge Functions sit behind a proxy. The original caller IP is in
  // x-forwarded-for as a comma-separated list; the first entry is the client.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const first = xff.split(",")[0]?.trim();
    if (first) return first;
  }
  const xri = req.headers.get("x-real-ip");
  if (xri) return xri.trim();
  return null;
};

const isPrivateIp = (ip: string): boolean => {
  // Skip lookups for unroutable / loopback / link-local addresses.
  if (ip === "127.0.0.1" || ip === "::1" || ip.startsWith("fe80")) return true;
  if (ip.startsWith("10.")) return true;
  if (ip.startsWith("192.168.")) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(ip)) return true;
  return false;
};

const lookupCountry = async (ip: string): Promise<string | null> => {
  // ipapi.co: free tier ~1000 lookups/day, no API key required.
  // We use the `/country/` endpoint which returns just the ISO code as plain text.
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://ipapi.co/${encodeURIComponent(ip)}/country/`, {
      headers: { "User-Agent": "mystic-garden-geo-lookup/1.0" },
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const text = (await res.text()).trim();
    // Valid response is a 2-letter ISO code. Error bodies are longer JSON.
    if (/^[A-Z]{2}$/.test(text)) return text;
    return null;
  } catch (_err) {
    return null;
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ip = extractClientIp(req);
    if (!ip || isPrivateIp(ip)) {
      return json({ country: null, reason: "no_public_ip" });
    }

    const country = await lookupCountry(ip);
    return json({ country });
  } catch (_err) {
    // Absolute safety net — never propagate errors to the client.
    return json({ country: null, reason: "lookup_failed" });
  }
});
