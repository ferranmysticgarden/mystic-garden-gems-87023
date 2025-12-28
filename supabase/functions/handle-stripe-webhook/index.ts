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
  "quick_life": "1 Vida Rápida",
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature || !webhookSecret) {
    return new Response("Missing signature or webhook secret", { status: 400 });
  }

  try {
    const body = await req.text();
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    console.log("Webhook event received:", event.type);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.user_id;
      const productId = session.metadata?.product_id;
      const customerEmail = session.customer_details?.email;
      const amountPaid = (session.amount_total || 0) / 100;

      console.log("Payment completed:", {
        userId,
        productId,
        customerEmail,
        amountPaid,
      });

      if (userId && productId) {
        // Crear cliente de Supabase con service role key para operaciones admin
        const supabaseAdmin = createClient(
          Deno.env.get("SUPABASE_URL") ?? "",
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
          { auth: { persistSession: false } }
        );

        // Calcular fecha de expiración si aplica
        let expiresAt = null;
        if (productId === "no_ads_month" || productId === "garden_pass") {
          expiresAt = new Date();
          expiresAt.setDate(expiresAt.getDate() + 30);
        }

        // Guardar la compra en la base de datos
        const { error: purchaseError } = await supabaseAdmin
          .from("user_purchases")
          .insert({
            user_id: userId,
            product_id: productId,
            expires_at: expiresAt,
          });

        if (purchaseError) {
          console.error("Error saving purchase:", purchaseError);
        } else {
          console.log("Purchase saved successfully");
        }

        // Si es una vida rápida, añadir la vida al progreso del juego
        if (productId === "quick_life") {
          const { data: progressData, error: progressError } = await supabaseAdmin
            .from("game_progress")
            .select("lives")
            .eq("user_id", userId)
            .single();

          if (!progressError && progressData) {
            const { error: updateError } = await supabaseAdmin
              .from("game_progress")
              .update({ lives: progressData.lives + 1 })
              .eq("user_id", userId);

            if (updateError) {
              console.error("Error updating lives:", updateError);
            } else {
              console.log("Life added successfully");
            }
          }
        }

        // Enviar email al administrador
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
          console.log("Admin notification email sent");
        } catch (emailError) {
          console.error("Error sending admin email:", emailError);
        }

        // Enviar email de confirmación al cliente
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
            console.log("Customer confirmation email sent");
          } catch (emailError) {
            console.error("Error sending customer email:", emailError);
          }
        }
      }
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Webhook error:", errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});