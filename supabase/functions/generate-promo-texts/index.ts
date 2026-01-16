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
    const { appName, appDescription, targetAudience } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

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
            content: `Eres un experto copywriter especializado en ASO (App Store Optimization) y Google Ads para juegos móviles.

Tu tarea es generar textos promocionales optimizados para conversión.

REGLAS CRÍTICAS:
1. Títulos cortos: MÁXIMO 30 caracteres (contando espacios y emojis)
2. Títulos largos: MÁXIMO 90 caracteres
3. Descripción corta: MÁXIMO 80 caracteres
4. Google Ads corto: MÁXIMO 30 caracteres (SIN emojis)
5. Google Ads largo: MÁXIMO 90 caracteres (SIN emojis)

TÉCNICAS DE CONVERSIÓN:
- Usa números específicos (+100, +50, 7 días)
- Incluye beneficios claros (GRATIS, premios, recompensas)
- Crea urgencia cuando sea apropiado
- Emojis SOLO para Play Store, NUNCA para Google Ads
- Call-to-action implícito

IMPORTANTE: Los textos de Google Ads NO pueden tener emojis.`
          },
          {
            role: "user",
            content: `Genera textos promocionales para:

App: ${appName}
Descripción: ${appDescription}
Público objetivo: ${targetAudience}

Genera textos en ESPAÑOL que maximicen descargas.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_promo_texts",
              description: "Generate promotional texts for app store and ads",
              parameters: {
                type: "object",
                properties: {
                  shortTitle: { 
                    type: "string", 
                    description: "App title for Play Store, max 30 chars, can include emoji" 
                  },
                  longTitle: { 
                    type: "string", 
                    description: "Extended title, max 90 chars, can include emoji" 
                  },
                  shortDescription: { 
                    type: "string", 
                    description: "Short description for Play Store, max 80 chars" 
                  },
                  fullDescription: { 
                    type: "string", 
                    description: "Full Play Store description with features, emojis, max 4000 chars" 
                  },
                  googleAdsShort: { 
                    type: "string", 
                    description: "Google Ads headline, max 30 chars, NO emojis" 
                  },
                  googleAdsLong: { 
                    type: "string", 
                    description: "Google Ads description, max 90 chars, NO emojis" 
                  }
                },
                required: ["shortTitle", "longTitle", "shortDescription", "fullDescription", "googleAdsShort", "googleAdsLong"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_promo_texts" } }
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
    let texts = null;
    
    if (toolCall?.function?.arguments) {
      try {
        texts = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error("Failed to parse tool call arguments:", e);
      }
    }

    // Fallback texts
    if (!texts) {
      texts = {
        shortTitle: "Mystic Garden - Match 3",
        longTitle: "🔮 Mystic Garden - Puzzle Match 3 Mágico con +50 Niveles",
        shortDescription: "¡Combina gemas en el bosque encantado! +50 niveles y premios diarios.",
        fullDescription: `🌟 MYSTIC GARDEN - Puzzle Match 3 Mágico

Descubre la magia del bosque encantado en este adictivo juego de puzzles.

✨ CARACTERÍSTICAS:
• +50 niveles desafiantes
• Power-ups mágicos
• Racha diaria con recompensas
• Ruleta de la suerte gratis
• Battle Pass exclusivo

💎 ¡Descarga gratis y comienza tu aventura!`,
        googleAdsShort: "Mystic Garden: +100 Gemas",
        googleAdsLong: "Puzzle Match-3 Magico - +50 Niveles y Recompensas Diarias Gratis"
      };
    }

    return new Response(
      JSON.stringify(texts),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Error in generate-promo-texts:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
