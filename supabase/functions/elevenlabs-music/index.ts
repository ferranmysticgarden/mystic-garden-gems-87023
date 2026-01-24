import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY not configured");
    }

    const { prompt, duration } = await req.json();
    
    console.log("[MUSIC] Generating music with prompt:", prompt);

    const response = await fetch(
      "https://api.elevenlabs.io/v1/music",
      {
        method: "POST",
        headers: {
          "xi-api-key": ELEVENLABS_API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: prompt || "A calm fantasy ambient background music for a magical garden puzzle game. Soft piano melody, light harp, gentle pads, subtle bells, relaxing and peaceful. No vocals, no drums, loopable, 80 BPM, 3 minutes. Style: mystical forest, cozy, magical, mobile game background music.",
          duration_seconds: duration || 180,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[MUSIC] ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.status}`);
    }

    const audioBuffer = await response.arrayBuffer();
    console.log("[MUSIC] Generated audio buffer size:", audioBuffer.byteLength);

    // Encode to base64 for safe JSON transport
    const base64Audio = base64Encode(audioBuffer);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioContent: base64Audio,
        size: audioBuffer.byteLength 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[MUSIC] Error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
