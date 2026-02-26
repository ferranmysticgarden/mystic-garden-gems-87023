import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ADMIN_EMAIL = 'fcanamases@gmail.com';

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const {
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      shippingCity,
      shippingPostalCode,
      shippingCountry,
      price,
      playerLevel,
      productName,
      stripeSessionId,
    } = await req.json();

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #10b981; border-bottom: 2px solid #10b981; padding-bottom: 10px;">
          🛒 ¡Nuevo Pedido de Producto!
        </h1>
        
        <div style="background: #f0fdf4; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <h2 style="margin-top: 0; color: #065f46;">📦 ${productName}</h2>
          <p style="font-size: 24px; font-weight: bold; color: #059669;">€${price.toFixed(2)}</p>
          <p style="color: #6b7280;">Nivel del jugador: ${playerLevel}</p>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">👤 Datos del Cliente</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280;">Nombre:</td><td style="padding: 8px 0; font-weight: bold;">${customerName}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Email:</td><td style="padding: 8px 0;"><a href="mailto:${customerEmail}">${customerEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280;">Teléfono:</td><td style="padding: 8px 0;">${customerPhone || 'No proporcionado'}</td></tr>
          </table>
        </div>

        <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #1e293b;">📍 Dirección de Envío</h3>
          <p style="margin: 5px 0;">${shippingAddress}</p>
          <p style="margin: 5px 0;">${shippingPostalCode} ${shippingCity}</p>
          <p style="margin: 5px 0;">${shippingCountry}</p>
        </div>

        <div style="background: #eff6ff; border-radius: 12px; padding: 15px; margin: 20px 0; text-align: center;">
          <p style="color: #3b82f6; margin: 0; font-size: 14px;">
            Stripe Session: <code>${stripeSessionId}</code>
          </p>
        </div>

        <div style="background: #fef3c7; border-radius: 12px; padding: 15px; margin: 20px 0;">
          <p style="color: #92400e; margin: 0; font-weight: bold;">
            ⚡ Acción requerida: Compra el producto en AliExpress y envíalo a la dirección del cliente.
          </p>
        </div>
      </div>
    `;

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: 'Mystic Garden Orders <onboarding@resend.dev>',
        to: [ADMIN_EMAIL],
        subject: `🛒 Nuevo pedido: ${productName} - €${price.toFixed(2)} - ${customerName}`,
        html: emailHtml,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("[ERROR] Resend failed:", errBody);
      throw new Error(`Email send failed: ${res.status}`);
    }

    console.log("[INFO] ✅ Order notification sent to", ADMIN_EMAIL);

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[ERROR] ❌ notify-product-order:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
