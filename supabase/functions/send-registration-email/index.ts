import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RegistrationEmailRequest {
  email: string;
  displayName: string;
}

const ADMIN_EMAIL = "tu-email@ejemplo.com"; // Cambiar por tu email

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, displayName }: RegistrationEmailRequest = await req.json();

    console.log("Sending registration email for:", email);

    // Enviar email al administrador
    const adminEmail = await resend.emails.send({
      from: "Mystic Garden <onboarding@resend.dev>",
      to: [ADMIN_EMAIL],
      subject: "¡Nuevo usuario registrado! 🎮",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">Nuevo Registro en Mystic Garden</h1>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Detalles del Usuario</h2>
            <p><strong>Nombre:</strong> ${displayName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
          </div>
          <p style="color: #6B7280;">Este es un email automático de notificación.</p>
        </div>
      `,
    });

    // Enviar email de bienvenida al usuario
    const welcomeEmail = await resend.emails.send({
      from: "Mystic Garden <onboarding@resend.dev>",
      to: [email],
      subject: "¡Bienvenido a Mystic Garden! 🌟",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #4F46E5;">¡Bienvenido a Mystic Garden, ${displayName}!</h1>
          <p>Estamos encantados de tenerte con nosotros.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h2 style="color: #374151; margin-top: 0;">Comienza tu aventura</h2>
            <ul style="color: #6B7280;">
              <li>💎 Completa niveles para ganar gemas</li>
              <li>🎮 Desbloquea power-ups especiales</li>
              <li>🏆 Alcanza el nivel más alto</li>
            </ul>
          </div>
          <p>¡Buena suerte y diviértete!</p>
          <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
            El equipo de Mystic Garden
          </p>
        </div>
      `,
    });

    console.log("Emails sent successfully:", { adminEmail, welcomeEmail });

    return new Response(
      JSON.stringify({ success: true }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-registration-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);