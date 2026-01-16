import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frames, appName, appDescription } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Use AI to analyze and recommend frames based on timestamps and context
    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Eres un experto en marketing de apps móviles y ASO (App Store Optimization). 
Tu tarea es recomendar los mejores frames de un video para usar como capturas de pantalla en Google Play Store.

El video es de un juego llamado "${appName}": ${appDescription}

Para capturas efectivas en Play Store, busca momentos que muestren:
1. Gameplay activo con efectos visuales llamativos
2. Interfaz clara con elementos importantes visibles
3. Momentos de acción (combos, explosiones, recompensas)
4. Diversidad de contenido (diferentes pantallas/niveles)
5. Momentos que transmitan emoción y diversión

Evita:
- Pantallas de carga
- Momentos estáticos sin acción
- Interfaces confusas o con mucho texto
- Frames borrosos o en transición`
          },
          {
            role: "user",
            content: `Analiza estos ${frames.length} frames extraídos del video y recomienda los 8 mejores para usar como capturas de pantalla en Google Play Store.

Frames disponibles (por timestamp en segundos):
${frames.map((f: any) => `- Frame ${f.index}: ${f.timestamp.toFixed(1)}s`).join('\n')}

Responde SOLO con un JSON array con este formato exacto:
[
  {"index": 0, "score": 85, "recommended": true, "reason": "Razón breve"},
  {"index": 1, "score": 60, "recommended": false, "reason": "Razón breve"},
  ...
]

Score del 0-100. Marca "recommended": true para los 8 mejores frames.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "recommend_frames",
              description: "Return frame recommendations for Play Store screenshots",
              parameters: {
                type: "object",
                properties: {
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        index: { type: "number" },
                        score: { type: "number" },
                        recommended: { type: "boolean" },
                        reason: { type: "string" }
                      },
                      required: ["index", "score", "recommended", "reason"]
                    }
                  }
                },
                required: ["recommendations"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "recommend_frames" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const aiResponse = await response.json();
    
    // Extract tool call result
    const toolCall = aiResponse.choices?.[0]?.message?.tool_calls?.[0];
    let recommendations = [];
    
    if (toolCall?.function?.arguments) {
      try {
        const parsed = JSON.parse(toolCall.function.arguments);
        recommendations = parsed.recommendations || [];
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Fallback if AI didn't return proper recommendations
    if (recommendations.length === 0) {
      recommendations = frames.map((f: any, i: number) => ({
        index: i,
        score: 80 - (i * 3),
        recommended: i < 8,
        reason: "Selección automática basada en distribución temporal"
      }));
    }

    return new Response(
      JSON.stringify({ recommendations }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in analyze-video-frames:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
