import { NextResponse } from "next/server";
import { capturePayPalOrder, completedCapture, getPayPalOrder } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const SITE_URL = "https://academiamagicaedu.com";

async function sendConfirmationEmail(reference: string, paymentToken: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("resend_not_configured", "RESEND_API_KEY no está definido; se omite el email de confirmación");
    return;
  }

  try {
    const supabase = await createClient();
    const { data: rows, error } = await supabase.rpc("get_enrollment_receipt", {
      p_ref: reference,
      p_token: paymentToken,
    });
    const data = Array.isArray(rows) ? rows[0] : rows;
    if (error || !data?.contact_email) {
      console.error("confirmation_email_lookup_failed", error?.message ?? "sin email de contacto");
      return;
    }

    const subjectNames = ((data.subject_names ?? []) as string[]).join(", ");
    const claimUrl = `${SITE_URL}/bienvenida?ref=${encodeURIComponent(reference)}&pt=${encodeURIComponent(paymentToken)}`;
    const fromAddress = process.env.RESEND_FROM_EMAIL || "Academia Mágica <notificaciones@academiamagicaedu.com>";

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#3b2a55;">
        <h1 style="font-size:22px;">¡Gracias, ${data.contact_full_name ?? ""}! Tu pago se confirmó ✨</h1>
        <p>Hemos recibido tu pago para <strong>${data.student_first_name ?? "tu hijo/a"}</strong>:</p>
        <ul>
          <li><strong>Materias:</strong> ${subjectNames || "—"}</li>
          <li><strong>Total pagado:</strong> ${Number(data.total_price_usd ?? 0).toFixed(2)} ${data.currency ?? "USD"}</li>
          <li><strong>Duración del acceso:</strong> ${data.access_months ?? 3} meses</li>
          <li><strong>Referencia:</strong> ${reference}</li>
        </ul>
        <p>Ahora falta un último paso: crear el usuario con el que tu hijo/a va a entrar a la plataforma.</p>
        <p style="text-align:center;margin:28px 0;">
          <a href="${claimUrl}" style="background:#6c5ce7;color:#ffffff;padding:14px 28px;border-radius:14px;text-decoration:none;font-weight:bold;display:inline-block;">Crear el usuario de mi hijo/a</a>
        </p>
        <p style="font-size:13px;color:#3b2a55aa;">Si el botón no funciona, copia y pega este enlace en tu navegador:<br>${claimUrl}</p>
        <p style="margin-top:24px;">Cualquier duda, respondé a este correo o escribinos a businesscatserrano@gmail.com.</p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: data.contact_email,
        subject: "Pago confirmado — creá el usuario de tu hijo/a en Academia Mágica",
        html,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("resend_send_failed", res.status, text);
    }
  } catch (e) {
    console.error("confirmation_email_unexpected_error", e instanceof Error ? e.message : String(e));
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      reference?: string;
      paymentToken?: string;
      orderId?: string;
    };
    const reference = body.reference?.trim() ?? "";
    const paymentToken = body.paymentToken?.trim() ?? "";
    const orderId = body.orderId?.trim() ?? "";
    if (!/^AM-[A-Z0-9]{8}$/.test(reference) ||
        !/^[0-9a-f-]{36}$/i.test(paymentToken) ||
        !/^[A-Z0-9]{8,80}$/i.test(orderId)) {
      return NextResponse.json({ error: "Datos de pago no válidos" }, { status: 400 });
    }

    let order;
    try {
      order = await capturePayPalOrder(orderId);
    } catch {
      order = await getPayPalOrder(orderId);
    }
    const capture = completedCapture(order);
    if (!capture) {
      return NextResponse.json({ error: "PayPal todavía no ha confirmado el pago" }, { status: 409 });
    }

    const serverSecret = process.env.PAYMENT_SERVER_SECRET;
    if (!serverSecret) throw new Error("Servidor de pagos no configurado");

    const supabase = await createClient();
    const { error } = await supabase.rpc("complete_enrollment_paypal_order", {
      p_public_reference: reference,
      p_payment_token: paymentToken,
      p_paypal_order_id: orderId,
      p_paypal_capture_id: capture.id,
      p_captured_amount: capture.amount,
      p_currency: capture.currency,
      p_server_secret: serverSecret,
    });
    if (error) throw error;

    // El email es un canal adicional al enlace que ya se muestra en la
    // página de éxito: si falla o no está configurado, no debe romper la
    // confirmación del pago (ya se otorgó el derecho de acceso).
    await sendConfirmationEmail(reference, paymentToken);

    return NextResponse.json({ ok: true, reference });
  } catch (error) {
    console.error("paypal_capture_order_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No hemos podido confirmar el pago. No vuelvas a pagarlo; contacta con nosotros." }, { status: 500 });
  }
}
