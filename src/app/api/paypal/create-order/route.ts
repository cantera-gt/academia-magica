import { NextResponse } from "next/server";
import { createPayPalOrder } from "@/lib/paypal";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type PaymentSummary = {
  public_reference: string;
  total_price_usd: number;
  currency: string;
  payment_status: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json() as { reference?: string; paymentToken?: string };
    const reference = body.reference?.trim() ?? "";
    const paymentToken = body.paymentToken?.trim() ?? "";
    if (!/^AM-[A-Z0-9]{8}$/.test(reference) ||
        !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(paymentToken)) {
      return NextResponse.json({ error: "Matrícula no válida" }, { status: 400 });
    }

    const serverSecret = process.env.PAYMENT_SERVER_SECRET;
    if (!serverSecret) throw new Error("Servidor de pagos no configurado");

    const supabase = await createClient();
    const { data, error } = await supabase.rpc("get_enrollment_payment_summary", {
      p_public_reference: reference,
      p_payment_token: paymentToken,
    });
    const summary = (data?.[0] ?? null) as PaymentSummary | null;
    if (error || !summary) return NextResponse.json({ error: "Matrícula no encontrada" }, { status: 404 });
    if (summary.payment_status === "paid") {
      return NextResponse.json({ error: "Esta matrícula ya está pagada" }, { status: 409 });
    }

    const origin = new URL(request.url).origin;
    const query = `ref=${encodeURIComponent(reference)}&pt=${encodeURIComponent(paymentToken)}`;
    const order = await createPayPalOrder({
      reference,
      amount: Number(summary.total_price_usd).toFixed(2),
      currency: summary.currency,
      returnUrl: `${origin}/matricula/pago/resultado?${query}`,
      cancelUrl: `${origin}/matricula/pago?${query}&cancelled=1`,
    });
    const approvalUrl = order.links?.find((link) => link.rel === "payer-action" || link.rel === "approve")?.href;
    if (!order.id || !approvalUrl) throw new Error("PayPal no devolvió el enlace de aprobación");

    const { error: registerError } = await supabase.rpc("register_enrollment_paypal_order", {
      p_public_reference: reference,
      p_payment_token: paymentToken,
      p_paypal_order_id: order.id,
    });
    if (registerError) throw registerError;

    return NextResponse.json({ approvalUrl });
  } catch (error) {
    console.error("paypal_create_order_failed", error instanceof Error ? error.message : "unknown");
    return NextResponse.json({ error: "No hemos podido iniciar PayPal. Inténtalo de nuevo." }, { status: 500 });
  }
}
