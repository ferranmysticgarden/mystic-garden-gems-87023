import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const ADMIN_EMAIL = "fcanamases@gmail.com";

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
};

// Rewards configuration for all products - synchronized with verify-google-purchase
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
  // First day offer
  "first_day_offer": { powerups: 5, lives: 3 },
  // Cofres (rewards are random, granted client-side)
  "chest_silver": {},
  "chest_gold": {},
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    console.error("[ERROR] Missing signature or webhook secret");
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);

    console.log("[INFO] Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const productId = session.metadata?.product_id;
      const customerEmail = session.customer_details?.email;
      const amountPaid = (session.amount_total || 0) / 100;

      console.log("[INFO] Payment completed:", { userId, productId, customerEmail, amountPaid });

      if (userId && productId) {
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        // Get rewards for this product
        const rewards = PRODUCT_REWARDS[productId];
        if (!rewards) {
          console.error("[ERROR] Unknown product:", productId);
          // Still save purchase record even for unknown products
        }

        // Calculate expiration date
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
          console.error("[ERROR] Error saving purchase:", purchaseError);
        } else {
          console.log("[INFO] Purchase saved successfully");
        }

        // Handle no_ads_forever separately
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
            .single();

          if (progressError && progressError.code !== 'PGRST116') {
            console.error("[ERROR] Error fetching game progress:", progressError);
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
            console.log(`[INFO] Adding ${rewards.gems} gems -> ${updates.gems}`);
          }
          if (rewards.lives) {
            updates.lives = Math.min(currentLives + rewards.lives, 99);
            console.log(`[INFO] Adding ${rewards.lives} lives -> ${updates.lives}`);
          }
          if (rewards.powerups) {
            const perType = Math.ceil(rewards.powerups / 3);
            updates.hammer_count = currentHammer + perType;
            updates.shuffle_count = currentShuffle + perType;
            updates.undo_count = currentUndo + perType;
            console.log(`[INFO] Adding ${perType} of each powerup`);
          }
          if (rewards.noAdsDays) {
            const expireDate = new Date();
            expireDate.setDate(expireDate.getDate() + rewards.noAdsDays);
            updates.unlimited_lives_until = expireDate.toISOString();
            console.log(`[INFO] Setting unlimited_lives_until to ${updates.unlimited_lives_until}`);
          }

          // Update or insert game progress
          if (progressData) {
            const { error: updateError } = await supabaseAdmin
              .from("game_progress")
              .update(updates)
              .eq("user_id", userId);

            if (updateError) {
              console.error("[ERROR] Error updating game progress:", updateError);
            } else {
              console.log("[INFO] Game progress updated successfully");
            }
          } else {
            // Create new game progress record
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
              console.error("[ERROR] Error inserting game progress:", insertError);
            } else {
              console.log("[INFO] Game progress created successfully");
            }
          }
        }

        // Send admin notification email
        try {
          await resend.emails.send({
            from: "Mystic Garden <onboarding@resend.dev>",
            to: [ADMIN_EMAIL],
            subject: "💰 ¡Nuevo pago recibido!",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h1 style="color: #10B981;">Nuevo Pago Recibido 💰</h1>
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h2 style="color: #374151; margin-top: 0;">Detalles del Pago</h2>
                  <p><strong>Producto:</strong> ${PRODUCT_NAMES[productId] || productId}</p>
                  <p><strong>Monto:</strong> €${amountPaid.toFixed(2)}</p>
                  <p><strong>Email del cliente:</strong> ${customerEmail}</p>
                  <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                  ${expiresAt ? `<p><strong>Expira:</strong> ${expiresAt.toLocaleString('es-ES')}</p>` : ''}
                </div>
                <p style="color: #6B7280;">Session ID: ${session.id}</p>
              </div>
            `,
          });
          console.log("[INFO] Admin notification email sent");
        } catch (emailError) {
          console.error("[ERROR] Error sending admin email:", emailError);
        }

        // Send customer confirmation email
        if (customerEmail) {
          try {
            await resend.emails.send({
              from: "Mystic Garden <onboarding@resend.dev>",
              to: [customerEmail],
              subject: "¡Gracias por tu compra! 🎉",
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h1 style="color: #4F46E5;">¡Compra Confirmada! 🎉</h1>
                  <p>Gracias por tu compra en Mystic Garden.</p>
                  <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h2 style="color: #374151; margin-top: 0;">Detalles de tu Compra</h2>
                    <p><strong>Producto:</strong> ${PRODUCT_NAMES[productId] || productId}</p>
                    <p><strong>Monto:</strong> €${amountPaid.toFixed(2)}</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                  </div>
                  <p>Tu compra está activa y lista para usar. ¡Disfruta del juego!</p>
                  <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
                    El equipo de Mystic Garden
                  </p>
                </div>
              `,
            });
            console.log("[INFO] Customer confirmation email sent");
          } catch (emailError) {
            console.error("[ERROR] Error sending customer email:", emailError);
          }
        }

        console.log(`[INFO] ✅ Purchase completed: ${productId} for user ${userId}`);
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("[ERROR] Webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
