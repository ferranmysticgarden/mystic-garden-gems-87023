import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno&no-check";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[WEBHOOK] ${step}${detailsStr}`);
};

const PRODUCT_NAMES: Record<string, string> = {
  "gems_100": "100 Gemas",
  "gems_300": "300 Gemas",
  "gems_1200": "1200 Gemas",
  "no_ads_month": "Sin Anuncios (1 Mes)",
  "no_ads_forever": "Sin Anuncios (Para Siempre)",
  "garden_pass": "Pase de Jardín Mensual",
  "quick_pack": "Pack Rápido (3 Vidas + 20 Gemas)",
  "mega_pack_inicial": "Mega Pack Inicial (500 Gemas + 10 Vidas)",
  "pack_revancha": "Pack Revancha (5 Vidas + 50 Gemas)",
  "starter_pack": "Starter Pack",
  "flash_offer": "Pack Relámpago",
  "continue_game": "Continuar Partida",
  "buy_moves": "Comprar Movimientos",
  "finish_level": "Termina Este Nivel",
  "victory_multiplier": "Multiplicador x3",
  "reward_doubler": "Duplicar Recompensa x2",
  "extra_spin": "Giro Extra",
  "streak_protection": "Protección de Racha",
  "lifesaver_pack": "Pack Salvavidas",
  "pack_victoria_segura": "Pack Victoria Segura",
  "pack_racha_infinita": "Pack Racha Infinita",
  "welcome_pack": "Pack Bienvenida",
  "pack_impulso": "Pack Impulso",
  "pack_experiencia": "Pack Experiencia",
  "pack_victoria_segura_pro": "Pack Victoria Segura Pro",
  "first_day_offer": "Oferta Primer Día",
  "chest_silver": "Cofre Plata",
  "chest_gold": "Cofre Oro",
};

const PRODUCT_REWARDS: Record<string, { gems?: number; lives?: number; powerups?: number; noAdsDays?: number; noAdsForever?: boolean }> = {
  "gems_100": { gems: 100 },
  "gems_300": { gems: 300 },
  "gems_1200": { gems: 1200 },
  "no_ads_month": { noAdsDays: 30 },
  "no_ads_forever": { noAdsForever: true },
  "garden_pass": { gems: 1000, noAdsDays: 30 },
  "quick_pack": { lives: 3, gems: 20 },
  "mega_pack_inicial": { gems: 500, lives: 10, powerups: 3, noAdsDays: 1 },
  "pack_revancha": { gems: 50, lives: 5 },
  "starter_pack": { gems: 500, lives: 10, powerups: 3 },
  "flash_offer": { lives: 10, gems: 150 },
  "continue_game": { lives: 1, powerups: 5 },
  "buy_moves": { powerups: 5 },
  "finish_level": { powerups: 5 },
  "victory_multiplier": { lives: 2 },
  "reward_doubler": { gems: 50 },
  "extra_spin": {},
  "streak_protection": {},
  "lifesaver_pack": { lives: 3 },
  "pack_victoria_segura": { powerups: 5, lives: 3 },
  "pack_racha_infinita": { lives: 2 },
  "welcome_pack": { powerups: 5, lives: 3 },
  "pack_impulso": { powerups: 5, lives: 3 },
  "pack_experiencia": { lives: 2 },
  "pack_victoria_segura_pro": { powerups: 8, lives: 3 },
  "first_day_offer": { powerups: 5, lives: 3 },
  "chest_silver": {},
  "chest_gold": {},
};

serve(async (req) => {
  const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const signature = req.headers.get("stripe-signature");

  logStep("Webhook received", { hasSignature: !!signature, hasSecret: !!webhookSecret, hasStripeKey: !!stripeKey });

  if (!signature || !webhookSecret) {
    logStep("ERROR: Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  if (!stripeKey) {
    logStep("ERROR: Missing STRIPE_SECRET_KEY");
    return new Response("Missing Stripe key", { status: 500 });
  }

  try {
    const stripe = new Stripe(stripeKey, { apiVersion: "2023-10-16" });
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    logStep("Event verified", { type: event.type });

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const productId = session.metadata?.product_id;
      const customerEmail = session.customer_details?.email;
      const amountPaid = (session.amount_total || 0) / 100;

      logStep("Payment completed", { userId, productId, customerEmail, amountPaid });

      if (userId && productId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        const rewards = PRODUCT_REWARDS[productId];
        logStep("Rewards lookup", { productId, rewards });

        // Calculate expiration
        let expiresAt: Date | null = null;
        if (rewards?.noAdsDays) {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + rewards.noAdsDays);
        }

        // Save purchase record
        const { error: purchaseError } = await supabaseAdmin
          .from("user_purchases")
          .insert({
            user_id: userId,
            product_id: `stripe_${productId}`,
            expires_at: expiresAt?.toISOString() || null,
          });

        if (purchaseError) {
          logStep("ERROR saving purchase", { error: purchaseError.message });
        } else {
          logStep("Purchase saved successfully");
        }

        // Handle no_ads_forever
        if (rewards?.noAdsForever) {
          await supabaseAdmin
            .from("user_purchases")
            .insert({
              user_id: userId,
              product_id: "no_ads_forever",
              expires_at: null,
            });
        }

        // Apply rewards to game_progress
        if (rewards && (rewards.gems || rewards.lives || rewards.powerups || rewards.noAdsDays)) {
          const { data: progressData, error: progressError } = await supabaseAdmin
            .from("game_progress")
            .select("gems, lives, hammer_count, shuffle_count, undo_count, unlimited_lives_until")
            .eq("user_id", userId)
            .maybeSingle();

          if (progressError) {
            logStep("ERROR fetching game progress", { error: progressError.message });
          }

          const currentGems = progressData?.gems || 0;
          const currentLives = progressData?.lives || 5;
          const currentHammer = progressData?.hammer_count || 0;
          const currentShuffle = progressData?.shuffle_count || 0;
          const currentUndo = progressData?.undo_count || 0;

          const updates: Record<string, unknown> = {
            updated_at: new Date().toISOString(),
          };

          if (rewards.gems) {
            updates.gems = currentGems + rewards.gems;
            logStep(`Adding ${rewards.gems} gems -> ${updates.gems}`);
          }
          if (rewards.lives) {
            updates.lives = Math.min(currentLives + rewards.lives, 99);
            logStep(`Adding ${rewards.lives} lives -> ${updates.lives}`);
          }
          if (rewards.powerups) {
            const perType = Math.floor(rewards.powerups / 3);
            const remainder = rewards.powerups % 3;
            updates.hammer_count = currentHammer + perType + (remainder >= 1 ? 1 : 0);
            updates.shuffle_count = currentShuffle + perType + (remainder >= 2 ? 1 : 0);
            updates.undo_count = currentUndo + perType;
            logStep(`Adding powerups: ${rewards.powerups} total, ${perType} base per type`);
          }
          if (rewards.noAdsDays) {
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + rewards.noAdsDays);
            updates.no_ads_until = expireDate.toISOString();
          }

          if (progressData) {
            const { error: updateError } = await supabaseAdmin
              .from("game_progress")
              .update(updates)
              .eq("user_id", userId);

            if (updateError) {
              logStep("ERROR updating game progress", { error: updateError.message });
            } else {
              logStep("✅ Game progress updated");
            }
          } else {
            const { error: insertError } = await supabaseAdmin
              .from("game_progress")
              .insert({
                user_id: userId,
                gems: rewards.gems || 0,
                lives: rewards.lives || 5,
                hammer_count: rewards.powerups ? Math.ceil(rewards.powerups / 3) : 0,
                shuffle_count: rewards.powerups ? Math.ceil(rewards.powerups / 3) : 0,
                undo_count: rewards.powerups ? Math.ceil(rewards.powerups / 3) : 0,
                unlimited_lives_until: rewards.noAdsDays 
                  ? new Date(Date.now() + rewards.noAdsDays * 24 * 60 * 60 * 1000).toISOString()
                  : null,
              });

            if (insertError) {
              logStep("ERROR inserting game progress", { error: insertError.message });
            } else {
              logStep("✅ Game progress created");
            }
          }
        }

        // Send admin notification
        try {
          const resendKey = Deno.env.get("RESEND_API_KEY");
          if (resendKey) {
            await fetch("https://api.resend.com/emails", {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${resendKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                from: "Mystic Garden <onboarding@resend.dev>",
                to: ["fcanamases@gmail.com"],
                subject: `💰 ¡Pago: ${PRODUCT_NAMES[productId] || productId} - €${amountPaid.toFixed(2)}!`,
                html: `<h1>💰 Pago Recibido</h1><p>Producto: ${PRODUCT_NAMES[productId] || productId}</p><p>Monto: €${amountPaid.toFixed(2)}</p><p>Email: ${customerEmail}</p>`,
              }),
            });
            logStep("Admin email sent");
          }
        } catch (emailError) {
          logStep("ERROR sending email", { error: String(emailError) });
        }

        // Push notification via ntfy.sh
        try {
          await fetch("https://ntfy.sh/mystic-garden-admin-7225", {
            method: "POST",
            headers: {
              "Title": `💰 Compra: ${PRODUCT_NAMES[productId] || productId}`,
              "Priority": "high",
              "Tags": "moneybag,tada",
            },
            body: `€${amountPaid.toFixed(2)} - ${customerEmail || 'anónimo'}`,
          });
          logStep("Push notification sent");
        } catch (pushErr) {
          logStep("Push notification failed", { error: String(pushErr) });
        }

        logStep(`✅ Purchase completed: ${productId} for user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
});